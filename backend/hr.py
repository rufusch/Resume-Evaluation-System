"""Owner-scoped hiring campaigns and explicitly triggered acceptance email delivery."""
import hashlib
import json
import os
import smtplib
import ssl
import uuid
from email.message import EmailMessage
from email.utils import formataddr
from typing import Literal, Optional

from email_validator import validate_email, EmailNotValidError
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.auth import get_current_user
from backend.database import get_db, json_dumps, json_loads
from backend.engine import parse_resume_content, parse_job_description, analyze_match
from backend.parser import extract_text_from_file

router = APIRouter(prefix="/api/hr", tags=["Career Lens HR"])
MAX_FILE = 10 * 1024 * 1024
DEFAULT_MESSAGE = "Thank you for your application. We are pleased to let you know that your application has been approved to move forward in our recruitment process. Our hiring team will contact you with the next steps."


def init_hr_db(conn):
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS hr_campaigns (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, title TEXT NOT NULL,
        jd_text TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS hr_applicants (
        id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, filename TEXT NOT NULL,
        name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', resume_text TEXT NOT NULL,
        result TEXT NOT NULL, score INTEGER, match_level TEXT NOT NULL,
        decision TEXT NOT NULL DEFAULT 'pending', email_status TEXT NOT NULL DEFAULT 'pending',
        email_error TEXT, sent_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS hr_owner ON hr_campaigns(owner_id);
    CREATE INDEX IF NOT EXISTS hr_campaign ON hr_applicants(campaign_id);
    """)


def owned_campaign(conn, campaign_id, user):
    row = conn.execute("SELECT * FROM hr_campaigns WHERE id=? AND owner_id=?", (campaign_id, user['id'])).fetchone()
    if not row:
        raise HTTPException(404, "Hiring campaign not found.")
    return dict(row)


def public_applicant(row):
    value = dict(row)
    value['result'] = json_loads(value['result'])
    return value


def valid_email(value):
    try:
        return validate_email(value.strip(), check_deliverability=False).normalized
    except EmailNotValidError:
        return None


def skill_score(result):
    skills = [r for r in result['requirements'] if r['category'] not in ['Education', 'Experience']]
    required = [r for r in skills if not r.get('is_preferred')]
    items = required or skills
    if not items:
        return None, 'unscored'
    weights = {'FULL MATCH': 1, 'PARTIAL MATCH': .5, 'NOT EVIDENCED': 0, 'UNCERTAIN': 0}
    score = round(100 * sum(weights[r['status']] for r in items) / len(items))
    return score, 'strong' if score >= 80 else 'medium' if score >= 50 else 'low'


async def document(upload):
    data = await upload.read(MAX_FILE + 1)
    if len(data) > MAX_FILE:
        raise ValueError('Each document must be 10 MB or smaller.')
    text = extract_text_from_file(data, upload.filename or '')
    if len(text.strip()) < 20:
        raise ValueError('The document contains too little readable text. Use a text-based PDF, DOCX or TXT.')
    return text, len(data)


@router.get('/campaigns')
def campaigns(user=Depends(get_current_user)):
    conn = get_db()
    try:
        return {'campaigns': [dict(r) for r in conn.execute('SELECT id,title,created_at FROM hr_campaigns WHERE owner_id=? ORDER BY created_at DESC, rowid DESC', (user['id'],))]}
    finally:
        conn.close()


@router.post('/campaigns')
async def create_campaign(resumes: list[UploadFile] = File(...), jd_text: str = Form(''),
                          jd_file: Optional[UploadFile] = File(None), user=Depends(get_current_user)):
    if not 1 <= len(resumes) <= 20:
        raise HTTPException(400, 'Upload between 1 and 20 resumes per campaign.')
    try:
        if jd_file and jd_file.filename:
            jd_text, _ = await document(jd_file)
        jd_text = jd_text.strip()
        if not 20 <= len(jd_text) <= 100000:
            raise ValueError('Provide one job description between 20 and 100,000 characters.')
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    jd = parse_job_description(jd_text)
    applicants, errors, total_bytes = [], [], 0
    for upload in resumes:
        try:
            resume, size = await document(upload)
            total_bytes += size
            if total_bytes > 50 * 1024 * 1024:
                raise HTTPException(400, 'Total readable uploads must be 50 MB or smaller.')
            profile = parse_resume_content(resume)
            result = analyze_match(resume, jd_text, profile, jd)
            score, level = skill_score(result)
            # Keep only evidence-based fields needed by the HR review, not generated career prose.
            review = {'requirements': result['requirements'], 'skill_gaps': result['skill_gaps']}
            applicants.append((str(uuid.uuid4()), upload.filename, profile['name'],
                               valid_email(profile['email']) or '', resume, json_dumps(review), score, level))
        except ValueError as exc:
            errors.append({'filename': upload.filename, 'error': str(exc)})
    if not applicants:
        raise HTTPException(400, {'message': 'No resumes could be read.', 'files': errors})
    campaign_id = str(uuid.uuid4())
    conn = get_db()
    try:
        with conn:
            conn.execute('INSERT INTO hr_campaigns(id,owner_id,title,jd_text) VALUES(?,?,?,?)',
                         (campaign_id, user['id'], jd['job_title'], jd_text))
            for item in applicants:
                conn.execute('INSERT INTO hr_applicants(id,campaign_id,filename,name,email,resume_text,result,score,match_level) VALUES(?,?,?,?,?,?,?,?,?)', (item[0], campaign_id, *item[1:]))
        return {'campaign_id': campaign_id, 'processed': len(applicants), 'errors': errors}
    finally:
        conn.close()


@router.get('/campaigns/{campaign_id}')
def get_campaign(campaign_id: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        campaign = owned_campaign(conn, campaign_id, user)
        campaign['applicants'] = [public_applicant(r) for r in conn.execute('SELECT * FROM hr_applicants WHERE campaign_id=? ORDER BY score DESC, name', (campaign_id,))]
        return campaign
    finally:
        conn.close()


class Review(BaseModel):
    decision: Literal['pending', 'approved', 'rejected']
    email: str = Field(default='', max_length=320)


@router.patch('/campaigns/{campaign_id}/applicants/{applicant_id}')
def review_applicant(campaign_id: str, applicant_id: str, req: Review, user=Depends(get_current_user)):
    email = valid_email(req.email) if req.email.strip() else ''
    if req.email.strip() and not email:
        raise HTTPException(400, 'Enter a valid applicant email address.')
    conn = get_db()
    try:
        with conn:
            conn.execute('BEGIN IMMEDIATE')
            owned_campaign(conn, campaign_id, user)
            row = conn.execute('SELECT * FROM hr_applicants WHERE id=? AND campaign_id=?', (applicant_id, campaign_id)).fetchone()
            if not row:
                raise HTTPException(404, 'Applicant not found.')
            if row['email_status'] in ('sending', 'uncertain'):
                raise HTTPException(409, 'Email is in progress or its delivery is uncertain. Review delivery with your SMTP provider before changing this applicant.')
            if row['email_status'] == 'sent' and email != row['email']:
                raise HTTPException(409, 'The email recipient cannot be changed after sending.')
            conn.execute('UPDATE hr_applicants SET decision=?, email=? WHERE id=?', (req.decision, email, applicant_id))
        return {'decision': req.decision, 'email': email}
    finally:
        conn.close()


def smtp_config():
    host, sender = os.getenv('SMTP_HOST', ''), os.getenv('SMTP_FROM', '')
    if not host or not valid_email(sender):
        raise ValueError('Email is not configured. Set SMTP_HOST and a valid SMTP_FROM on the backend.')
    mode = os.getenv('SMTP_SECURITY', 'starttls')
    if mode not in ('starttls', 'ssl'):
        raise ValueError('SMTP_SECURITY must be starttls or ssl.')
    try:
        port = int(os.getenv('SMTP_PORT', '465' if mode == 'ssl' else '587'))
        if not 1 <= port <= 65535:
            raise ValueError()
    except ValueError:
        raise ValueError('SMTP_PORT must be a valid port number.')
    return dict(host=host, sender=sender, mode=mode, port=port,
                username=os.getenv('SMTP_USERNAME', ''), password=os.getenv('SMTP_PASSWORD', ''))


class EmailDraft(BaseModel):
    message: str = Field(default=DEFAULT_MESSAGE, min_length=20, max_length=5000)


class SendDraft(EmailDraft):
    preview_token: str


def email_plan(conn, campaign, message):
    rows = conn.execute('SELECT * FROM hr_applicants WHERE campaign_id=? AND decision=? ORDER BY id', (campaign['id'], 'approved')).fetchall()
    recipients, excluded, seen = [], [], set()
    # An address already contacted in this campaign must not receive another email.
    contacted = {r['email'].casefold() for r in conn.execute("SELECT email FROM hr_applicants WHERE campaign_id=? AND email_status IN ('sent','sending','uncertain')", (campaign['id'],))}
    for row in rows:
        email = valid_email(row['email'])
        reason = None
        if row['email_status'] not in ('pending', 'failed'):
            reason = f"Email status: {row['email_status']}"
        elif not email:
            reason = 'Missing or invalid email address'
        elif email.casefold() in seen or email.casefold() in contacted:
            reason = 'Duplicate recipient in this campaign'
        if reason:
            excluded.append({'id': row['id'], 'name': row['name'], 'reason': reason})
        else:
            seen.add(email.casefold())
            recipients.append({'id': row['id'], 'name': row['name'], 'email': email})
    subject = f"Career Lens — Application update: {campaign['title']}".replace('\r', ' ').replace('\n', ' ')
    token = hashlib.sha256(json.dumps([campaign['id'], recipients, subject, message], sort_keys=True).encode()).hexdigest()
    return {'recipients': recipients, 'excluded': excluded, 'subject': subject, 'message': message,
            'preview_token': token, 'greeting': 'Hello [applicant name],', 'signature': 'Hiring team · Career Lens'}


@router.post('/campaigns/{campaign_id}/emails/preview')
def preview_emails(campaign_id: str, req: EmailDraft, user=Depends(get_current_user)):
    conn = get_db()
    try:
        plan = email_plan(conn, owned_campaign(conn, campaign_id, user), req.message)
        try:
            smtp_config()
            plan['smtp_ready'], plan['configuration_error'] = True, None
        except ValueError as exc:
            plan['smtp_ready'], plan['configuration_error'] = False, str(exc)
        return plan
    finally:
        conn.close()


def deliver(recipient, subject, message, config):
    """Return delivery certainty. Never retry an ambiguous SMTP submission automatically."""
    client, submitting = None, False
    try:
        if config['mode'] == 'ssl':
            client = smtplib.SMTP_SSL(config['host'], config['port'], timeout=15, context=ssl.create_default_context())
        else:
            client = smtplib.SMTP(config['host'], config['port'], timeout=15)
            client.starttls(context=ssl.create_default_context())
        if config['username']:
            client.login(config['username'], config['password'])
        mail = EmailMessage()
        mail['From'] = formataddr(('Career Lens', config['sender']))
        mail['To'] = recipient['email']
        mail['Subject'] = subject
        mail['Message-ID'] = f"<career-lens-{recipient['id']}@{config['sender'].split('@')[-1]}>"
        mail.set_content(f"Hello {recipient['name']},\n\n{message}\n\nHiring team · Career Lens")
        submitting = True
        refused = client.send_message(mail)
        return ('failed', 'SMTP rejected this recipient.') if refused else ('sent', None)
    except (smtplib.SMTPRecipientsRefused, smtplib.SMTPSenderRefused, smtplib.SMTPDataError):
        return 'failed', 'SMTP rejected the message. Check your provider before retrying.'
    except Exception:
        return ('uncertain', 'Submission outcome is uncertain. Check SMTP logs; automatic retry is disabled.') if submitting else ('failed', 'Could not connect or authenticate with SMTP. Check backend configuration.')
    finally:
        if client:
            try:
                client.close()
            except Exception:
                pass


@router.post('/campaigns/{campaign_id}/emails/send')
def send_emails(campaign_id: str, req: SendDraft, user=Depends(get_current_user)):
    conn = get_db()
    try:
        # Claim the reviewed recipient snapshot atomically to prevent duplicate clicks/concurrent sends.
        with conn:
            conn.execute('BEGIN IMMEDIATE')
            campaign = owned_campaign(conn, campaign_id, user)
            plan = email_plan(conn, campaign, req.message)
            if req.preview_token != plan['preview_token']:
                raise HTTPException(409, 'The recipients or message changed. Preview the emails again.')
            if not plan['recipients']:
                return {'results': [], 'message': 'No approved applicants are eligible for an email.'}
            try:
                config = smtp_config()
            except ValueError as exc:
                raise HTTPException(503, str(exc))
            for recipient in plan['recipients']:
                conn.execute("UPDATE hr_applicants SET email_status='sending',email_error=NULL WHERE id=?", (recipient['id'],))
        results = []
        for recipient in plan['recipients']:
            status, error = deliver(recipient, plan['subject'], req.message, config)
            with conn:
                conn.execute("UPDATE hr_applicants SET email_status=?,email_error=?,sent_at=CASE WHEN ?='sent' THEN CURRENT_TIMESTAMP ELSE sent_at END WHERE id=?", (status, error, status, recipient['id']))
            results.append({'id': recipient['id'], 'email': recipient['email'], 'status': status, 'error': error})
        return {'results': results, 'message': 'Email processing complete. Sent means accepted by the SMTP server, not confirmed inbox delivery.'}
    finally:
        conn.close()
