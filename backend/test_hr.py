"""HR workflow tests. SMTP is mocked; no real applicants are contacted."""
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend import database
from backend.hr import deliver


class HRTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = patch.object(database, 'DB_PATH', Path(self.temp.name) / 'test.db')
        self.db.start()
        self.client = TestClient(app)
        self.client.__enter__()
        self.headers = self.signup('hr@example.com')
        self.other = self.signup('other@example.com')

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.db.stop()
        self.temp.cleanup()

    def signup(self, email):
        r = self.client.post('/api/auth/signup', json={'name':'HR Tester', 'email':email, 'password':'TestPassword123!'})
        self.assertEqual(r.status_code, 200, r.text)
        return {'Authorization': 'Bearer ' + r.json()['access_token']}

    def batch(self):
        files = [('resumes', ('strong.txt', b'Alice Strong\nalice@example.com\nEXPERIENCE\nApplied financial analysis and bookkeeping at a local business.', 'text/plain')),
                 ('resumes', ('medium.txt', b'Bob Medium\nbob@example.com\nEXPERIENCE\nApplied bookkeeping to manage monthly business records.', 'text/plain')),
                 ('resumes', ('low.txt', b'Chris Low\nchris@example.com\nEXPERIENCE\nProvided patient care in a community clinic.', 'text/plain')),
                 ('resumes', ('invalid.txt', b'', 'text/plain'))]
        r = self.client.post('/api/hr/campaigns', headers=self.headers, data={'jd_text': 'Position: Accountant\nRequired skills: financial analysis, bookkeeping'}, files=files)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()['processed'], 3)
        self.assertEqual(len(r.json()['errors']), 1)
        self.base = '/api/hr/campaigns/' + r.json()['campaign_id']
        return self.client.get(self.base, headers=self.headers).json()['applicants']

    def review(self, row, decision, email=None):
        return self.client.patch(self.base + '/applicants/' + row['id'], headers=self.headers, json={'decision':decision, 'email':row['email'] if email is None else email})

    def preview(self):
        r = self.client.post(self.base + '/emails/preview', headers=self.headers, json={})
        self.assertEqual(r.status_code, 200, r.text)
        return r.json()

    def send(self, plan):
        return self.client.post(self.base + '/emails/send', headers=self.headers, json={'message':plan['message'], 'preview_token':plan['preview_token']})

    def test_batch_match_decisions_and_isolation(self):
        rows = self.batch()
        self.assertEqual([r['match_level'] for r in rows], ['strong', 'medium', 'low'])
        self.assertEqual([r['score'] for r in rows], [100, 50, 0])
        self.assertTrue(all(r['decision'] == 'pending' for r in rows))
        self.assertEqual(self.review(rows[0], 'approved').status_code, 200)
        self.assertEqual(self.review(rows[1], 'rejected').status_code, 200)
        saved = self.client.get(self.base, headers=self.headers).json()['applicants']
        self.assertEqual(saved[0]['decision'], 'approved')
        self.assertEqual(saved[1]['decision'], 'rejected')
        self.assertEqual(self.client.get(self.base, headers=self.other).status_code, 404)
        self.assertEqual(self.client.post(self.base+'/emails/preview', headers=self.other, json={}).status_code, 404)
        self.assertEqual(self.client.patch(self.base+'/applicants/'+rows[0]['id'], headers=self.other, json={'decision':'approved','email':'x@example.com'}).status_code,404)
        self.assertEqual(self.client.get('/api/hr/campaigns').status_code,401)
        self.assertEqual(self.review(rows[0], 'approved', 'not an email').status_code,400)

    def test_send_only_approved_and_prevent_repeat(self):
        rows = self.batch()
        self.review(rows[0], 'approved')
        self.review(rows[1], 'rejected')
        with patch.dict(os.environ, {'SMTP_HOST':'smtp.example.com','SMTP_FROM':'hr@example.com'}), patch('backend.hr.smtplib.SMTP') as smtp:
            smtp.return_value.send_message.return_value = {}
            plan = self.preview()
            self.assertEqual(len(plan['recipients']), 1)
            self.assertEqual(self.send(plan).json()['results'][0]['status'], 'sent')
            self.assertEqual(self.send(plan).status_code, 409)
            self.assertEqual(self.preview()['recipients'], [])
            self.assertEqual(smtp.return_value.send_message.call_count, 1)
            mail = smtp.return_value.send_message.call_args.args[0]
            self.assertEqual(mail['To'], 'alice@example.com')
            self.assertIn('Career Lens', mail['Subject'])
            self.assertEqual(self.review(rows[0],'approved','changed@example.com').status_code,409)

    def test_stale_preview_missing_duplicate_and_config(self):
        rows = self.batch()
        self.review(rows[0], 'approved')
        self.review(rows[1], 'approved', rows[0]['email'])
        self.review(rows[2], 'approved', '')
        with patch.dict(os.environ, {'SMTP_HOST':'','SMTP_FROM':''}):
            plan = self.preview()
            self.assertFalse(plan['smtp_ready'])
            self.assertEqual(len(plan['recipients']),1)
            self.assertEqual(len(plan['excluded']),2)
            self.assertEqual(self.send(plan).status_code,503)
        with patch.dict(os.environ, {'SMTP_HOST':'smtp.example.com','SMTP_FROM':'hr@example.com'}), patch('backend.hr.deliver') as sender:
            plan = self.preview()
            self.review(rows[0],'rejected')
            self.review(rows[1],'rejected')
            self.assertEqual(self.send(plan).status_code,409)
            sender.assert_not_called()

    def test_failed_delivery_is_reported_and_can_retry(self):
        rows = self.batch(); self.review(rows[0], 'approved')
        with patch.dict(os.environ, {'SMTP_HOST':'smtp.example.com','SMTP_FROM':'hr@example.com'}), patch('backend.hr.smtplib.SMTP', side_effect=OSError('offline')):
            result = self.send(self.preview())
            self.assertEqual(result.json()['results'][0]['status'], 'failed')
            self.assertEqual(len(self.preview()['recipients']),1)

    def test_uncertain_submission_is_not_retried(self):
        rows = self.batch(); self.review(rows[0], 'approved')
        with patch.dict(os.environ, {'SMTP_HOST':'smtp.example.com','SMTP_FROM':'hr@example.com'}), patch('backend.hr.smtplib.SMTP') as smtp:
            smtp.return_value.send_message.side_effect = TimeoutError()
            result = self.send(self.preview())
            self.assertEqual(result.json()['results'][0]['status'],'uncertain')
            self.assertEqual(self.preview()['recipients'],[])
            self.assertEqual(self.review(rows[0],'rejected').status_code,409)

    def test_unscored_and_bad_files(self):
        r = self.client.post('/api/hr/campaigns', headers=self.headers, data={'jd_text':'Position: Specialist\nWork with the team to achieve excellent outcomes.'}, files=[('resumes',('resume.txt',b'Alex Example\nProfessional with broad experience in local services.','text/plain'))])
        self.assertEqual(r.status_code,200,r.text)
        row=self.client.get('/api/hr/campaigns/'+r.json()['campaign_id'],headers=self.headers).json()['applicants'][0]
        self.assertEqual(row['match_level'],'unscored')
        self.assertIsNone(row['score'])
        r=self.client.post('/api/hr/campaigns',headers=self.headers,data={'jd_text':'Required skills: Python, SQL'},files=[('resumes',('bad.txt',b'','text/plain'))])
        self.assertEqual(r.status_code,400)


if __name__ == '__main__':
    unittest.main()
