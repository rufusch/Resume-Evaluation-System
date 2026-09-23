import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, Users, CheckCircle2, Mail, Upload, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import './HR.css';

const bands = [
  { key: 'strong', title: 'Strong match', hint: '80–100% skill evidence', tone: 'strong' },
  { key: 'medium', title: 'Medium match', hint: '50–79% skill evidence', tone: 'medium' },
  { key: 'low', title: 'Low match', hint: 'Below 50% skill evidence', tone: 'low' },
  { key: 'unscored', title: 'Needs manual review', hint: 'No recognized job skills', tone: 'neutral' },
];
const initialMessage = 'Thank you for your application. We are pleased to let you know that your application has been approved to move forward in our recruitment process. Our hiring team will contact you with the next steps.';

function Applicant({ item, busy, onReview }) {
  const [email, setEmail] = useState(item.email);
  const locked = ['sending', 'uncertain'].includes(item.email_status);
  const skills = item.result.requirements.filter((r) => !['Education', 'Experience'].includes(r.category));
  return (
    <article className="hr-applicant">
      <div className="hr-applicant-heading"><h3>{item.name}</h3><strong>{item.score == null ? 'Unscored' : `${item.score}%`}</strong></div>
      <p className="hr-muted hr-filename">{item.filename}</p>
      <div className="hr-tags"><span className={`hr-pill ${item.decision}`}>{item.decision}</span><span className="hr-pill">Email: {item.email_status}</span></div>
      <label className="form-label" htmlFor={`email-${item.id}`}>Applicant email</label>
      <input id={`email-${item.id}`} type="email" className="form-input" value={email} placeholder="Add or correct the extracted email" disabled={busy || locked || item.email_status === 'sent'} onChange={(e) => setEmail(e.target.value)} />
      {email !== item.email && <button className="btn-secondary" disabled={busy || locked} onClick={() => onReview(item, item.decision, email)}>Save email</button>}
      {!item.email && <p className="hr-muted">Add an email address before sending an acceptance email.</p>}
      <div className="hr-actions">
        <button className="hr-approve" disabled={busy || locked || item.decision === 'approved'} onClick={() => onReview(item, 'approved', email)}>Approve</button>
        <button className="hr-reject" disabled={busy || locked || item.decision === 'rejected'} onClick={() => onReview(item, 'rejected', email)}>Reject</button>
        {item.decision !== 'pending' && <button className="btn-secondary" disabled={busy || locked} onClick={() => onReview(item, 'pending', email)}>Reset decision</button>}
      </div>
      {item.email_status === 'sent' && <p className="hr-muted">Email submitted {item.sent_at} UTC. Changing the decision does not recall it.</p>}
      {item.email_status === 'sending' && <p className="hr-muted">Delivery is in progress. Refresh to see the result. If interrupted, check SMTP logs before retrying.</p>}
      {item.email_error && <p className="hr-error" role="status">{item.email_error}</p>}
      <details>
        <summary>Review skill evidence ({skills.length})</summary>
        {!skills.length && <p>No recognized skills. Review the resume manually before deciding.</p>}
        {skills.map((skill) => <div className="hr-evidence" key={skill.requirement}>
          <strong>{skill.requirement}</strong> <StatusBadge status={skill.status} />
          <p className="hr-muted">{skill.is_preferred ? 'Preferred' : 'Required'}</p>
          <p>{skill.resume_evidence || skill.gap || skill.explanation}</p>
        </div>)}
      </details>
      <details><summary>Read extracted resume</summary><pre className="hr-resume">{item.resume_text}</pre></details>
    </article>
  );
}

export default function HR() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [jd, setJd] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploadErrors, setUploadErrors] = useState([]);
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [message, setMessage] = useState(initialMessage);
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    api.listCampaigns().then((data) => { if (active) setCampaigns(data.campaigns); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  async function action(fn) {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  function invalidatePreview() { setPreview(null); setConfirmed(false); }
  async function openCampaign(id) {
    await action(async () => {
      setCampaign(await api.getCampaign(id));
      setUploadErrors([]); setDecisionFilter('all'); invalidatePreview();
    });
  }
  async function create(event) {
    event.preventDefault();
    if (!resumes.length || resumes.length > 20) { setError('Select 1–20 resumes.'); return; }
    if (resumes.some((file) => file.size > 10 * 1024 * 1024) || (jdFile && jdFile.size > 10 * 1024 * 1024)) { setError('Each document must be 10 MB or smaller.'); return; }
    if (resumes.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) { setError('Select at most 50 MB of resumes.'); return; }
    await action(async () => {
      const form = new FormData();
      if (jdFile) form.append('jd_file', jdFile); else form.append('jd_text', jd);
      resumes.forEach((file) => form.append('resumes', file));
      const result = await api.createCampaign(form);
      setCampaign(await api.getCampaign(result.campaign_id));
      setCampaigns((await api.listCampaigns()).campaigns);
      setUploadErrors(result.errors);
      setNotice(`Checked ${result.processed} resume${result.processed === 1 ? '' : 's'}. Review each applicant before deciding.`);
      invalidatePreview();
    });
  }
  async function review(item, decision, email) {
    await action(async () => {
      await api.reviewApplicant(campaign.id, item.id, { decision, email });
      setCampaign(await api.getCampaign(campaign.id)); invalidatePreview();
      setNotice(`${item.name}: ${decision}. No email has been sent by this action.`);
    });
  }
  async function previewEmails() {
    await action(async () => { setConfirmed(false); setPreview(await api.previewEmails(campaign.id, message)); });
  }
  async function sendEmails() {
    if (!confirmed || !preview) return;
    await action(async () => {
      const result = await api.sendEmails(campaign.id, message, preview.preview_token);
      setCampaign(await api.getCampaign(campaign.id)); invalidatePreview();
      const sent = result.results.filter((item) => item.status === 'sent').length;
      setNotice(`${sent} email(s) accepted by the SMTP server; ${result.results.length - sent} need attention. Review delivery status on each applicant card.`);
    });
  }
  const applicants = campaign?.applicants || [];
  const approved = applicants.filter((item) => item.decision === 'approved').length;

  return <div className="container hr-page">
    <header className="hr-header"><div><p className="hr-eyebrow"><BriefcaseBusiness size={16} /> Career Lens · HR workspace</p><h1>{campaign ? campaign.title : 'Find the evidence. Make the decision.'}</h1><p>One role. Every applicant. A clear view of the skills that match.</p></div>
      {campaign && <button className="btn-secondary" disabled={busy} onClick={() => { setCampaign(null); setError(''); setNotice(''); setUploadErrors([]); invalidatePreview(); }}><ArrowLeft size={16} /> New review</button>}
    </header>
    {error && <div role="alert" className="hr-alert hr-error">{error}</div>}
    {notice && <div role="status" className="hr-alert">{notice}</div>}
    {busy && <p role="status" className="hr-progress">{preview && confirmed ? 'Sending emails. Please keep this page open…' : 'Working… Please wait.'}</p>}
    {!!uploadErrors.length && <div className="hr-alert"><strong>Some resumes could not be checked:</strong><ul>{uploadErrors.map((item, i) => <li key={i}>{item.filename}: {item.error}</li>)}</ul></div>}

    {!campaign ? <div className="hr-start-grid">
      <form className="card-cream hr-form" onSubmit={create}>
        <h2><Upload size={20} /> Start a hiring review</h2>
        <label className="form-label" htmlFor="hr-jd">1. Job description</label>
        <textarea id="hr-jd" className="form-input" rows={8} placeholder="Paste the role, responsibilities and required / preferred skills…" value={jd} disabled={busy || !!jdFile} onChange={(e) => setJd(e.target.value)} required={!jdFile} minLength={20} maxLength={100000} />
        <label className="form-label" htmlFor="hr-jd-file">Or upload one JD document</label>
        <input id="hr-jd-file" type="file" accept=".pdf,.docx,.txt" disabled={busy} onChange={(e) => setJdFile(e.target.files[0] || null)} />
        {jdFile && <p className="hr-muted">Using {jdFile.name} instead of pasted text. <button type="button" onClick={() => setJdFile(null)}>Use pasted text</button></p>}
        <label className="form-label" htmlFor="hr-resumes">2. Applicant resumes</label>
        <input id="hr-resumes" type="file" accept=".pdf,.docx,.txt" multiple required disabled={busy} onChange={(e) => setResumes(Array.from(e.target.files))} />
        <p className="hr-muted">PDF, DOCX or TXT · Up to 20 resumes · 10 MB per file · 50 MB total</p>
        {!!resumes.length && <ul className="hr-file-list">{resumes.map((file, index) => <li key={index}>{file.name}</li>)}</ul>}
        <button className="btn-primary" disabled={busy} type="submit"><Users size={17} />{busy ? 'Checking resumes…' : 'Check resumes & open dashboard'}</button>
      </form>
      <aside className="card-cream hr-saved"><h2>Saved hiring reviews</h2><p className="hr-muted">Your campaigns are saved to your account. A new account starts with an empty workspace.</p>
        {!campaigns.length && <p>No reviews yet. Add a job description and resumes to begin.</p>}
        {campaigns.map((item) => <button key={item.id} disabled={busy} onClick={() => openCampaign(item.id)}><strong>{item.title}</strong><span>{item.created_at} UTC</span></button>)}
      </aside>
    </div> : <>
      <div className="hr-stats">
        <div><Users size={20} /><strong>{applicants.length}</strong><span>Applicants checked</span></div>
        <div><CheckCircle2 size={20} /><strong>{approved}</strong><span>Approved by HR</span></div>
        <div><BriefcaseBusiness size={20} /><strong>{applicants.filter((item) => item.decision === 'pending').length}</strong><span>Awaiting decision</span></div>
        <div><Mail size={20} /><strong>{applicants.filter((item) => item.email_status === 'sent').length}</strong><span>Emails submitted</span></div>
      </div>
      <section className="card-cream hr-method"><h2>Applicant dashboard</h2><p>Match levels measure required job-skill evidence (or preferred skills when no required skills are detected): full evidence = 1, partial = ½, missing / uncertain = 0. Strong ≥80%; medium ≥50%; low &lt;50%. A match level never approves or rejects an applicant.</p><p>Review the extracted resume and evidence before deciding. Missing evidence does not prove a person lacks a skill.</p>
        <details><summary>View job description</summary><pre className="hr-resume">{campaign.jd_text}</pre></details>
        <div className="hr-toolbar"><label htmlFor="decision-filter">Show decisions <select id="decision-filter" value={decisionFilter} disabled={busy} onChange={(e) => setDecisionFilter(e.target.value)}><option value="all">All applicants</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><button className="btn-secondary" disabled={busy} onClick={() => openCampaign(campaign.id)}>Refresh dashboard</button></div>
      </section>
      <div className="hr-board">
        {bands.filter((band) => band.key !== 'unscored' || applicants.some((item) => item.match_level === 'unscored')).map((band) => {
          const all = applicants.filter((item) => item.match_level === band.key);
          const visible = all.filter((item) => decisionFilter === 'all' || item.decision === decisionFilter);
          return <section className={`hr-column ${band.tone}`} key={band.key} aria-label={band.title}>
            <header><h2>{band.title} <span>{all.length}</span></h2><p>{band.hint}</p></header>
            {!visible.length && <p className="hr-empty">No applicants in this group{decisionFilter !== 'all' ? ' for this filter' : ''}.</p>}
            {visible.map((item) => <Applicant key={`${item.id}-${item.email}`} item={item} busy={busy} onReview={review} />)}
          </section>;
        })}
      </div>
      <section className="card-cream hr-email"><h2><Mail size={20} /> Notify approved applicants</h2><p>Finish reviewing, check the recipient list, then send individual acceptance emails. Rejected and pending applicants will not be emailed. Previously contacted addresses are skipped.</p>
        <label htmlFor="acceptance-message" className="form-label">Message to approved applicants</label>
        <textarea id="acceptance-message" className="form-input" rows={5} minLength={20} maxLength={5000} disabled={busy} value={message} onChange={(e) => { setMessage(e.target.value); invalidatePreview(); }} />
        <button className="btn-secondary" disabled={busy || message.trim().length < 20} onClick={previewEmails}>Preview recipients & email</button>
        {preview && <div className="hr-preview">
          {!preview.smtp_ready && <p role="alert" className="hr-error">{preview.configuration_error}</p>}
          <h3>{preview.recipients.length} recipient(s) ready</h3>
          <ul>{preview.recipients.map((item) => <li key={item.id}>{item.name} — {item.email}</li>)}</ul>
          {!!preview.excluded.length && <details open><summary>Skipped applicants ({preview.excluded.length})</summary><ul>{preview.excluded.map((item) => <li key={item.id}>{item.name}: {item.reason}</li>)}</ul></details>}
          <div className="hr-message"><strong>Subject: {preview.subject}</strong><p>{preview.greeting}</p><p style={{ whiteSpace: 'pre-wrap' }}>{preview.message}</p><p>{preview.signature}</p></div>
          <label className="hr-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)} /> I have reviewed these recipients and approve sending this message.</label>
          <button className="btn-primary" disabled={busy || !confirmed || !preview.smtp_ready || !preview.recipients.length} onClick={sendEmails}>Send acceptance emails ({preview.recipients.length})</button>
          <p className="hr-muted">“Sent” means the SMTP provider accepted the message. Inbox delivery is not guaranteed. Failed connections can be retried after correction; uncertain submissions are held for manual checking.</p>
        </div>}
      </section>
    </>}
  </div>;
}
