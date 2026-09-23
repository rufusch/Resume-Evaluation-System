# Career Lens

React/Vite frontend and FastAPI backend for resume-to-job matching, resume insights, skill gaps, mock interview practice, saved analyses, and what-if career simulations.

## Requirements

- Python 3.12 (tested)
- Node.js 24 (tested) and npm

## Run locally

From the repository root, create a Python environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:JWT_SECRET = 'replace-with-a-long-random-secret'
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

On macOS/Linux, use `.venv/bin/python` and `export JWT_SECRET='...'` instead.

In another terminal:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://localhost:5173. API documentation is at http://localhost:8000/docs.
Create an account in the application before uploading a resume and job description.

Run the backend from the repository root so the `backend.*` imports resolve. The backend creates its SQLite database on startup; no existing accounts or database are included.

## Configuration

Backend environment variables:

- `JWT_SECRET`: token signing secret. Set a strong value outside local testing; the source includes a development fallback.
- `DATABASE_PATH`: optional SQLite file path. Defaults to `backend/ai_career.db`. Its parent directory must exist.

The backend reads process environment variables directly; it does not automatically load a `.env` file.

Frontend: copy `frontend/.env.example` to `frontend/.env.local` to customize `VITE_API_BASE_URL`. It defaults to `http://localhost:8000`. Restart Vite after changing it; production builds embed the configured value.

## Build and tests

```sh
cd frontend
npm run build
npm run lint
```

From the repository root, with the Python environment activated:

```powershell
$env:DATABASE_PATH = Join-Path (Get-Location) 'test-career.db'
python backend/test_backend.py
```

The test creates synthetic users and analyses. Use a separate test database.

## Integration verification

The supplied application source was checked on 23 September 2026 without application-source edits:

- All 13 backend pipeline test stages passed.
- Frontend production build passed with Vite 8.3.0.
- The frontend API client passed live HTTP checks for authentication, uploads, analysis retrieval, interviews, what-if simulation, history, password changes, and deletion.
- CORS preflight passed for the local frontend origin.
- Browser login, history, and analysis rendering passed.

**Unresolved:** uploading a selected TXT file through the Codex in-app browser returned `Failed to fetch` before the upload POST reached the backend. The same file uploaded successfully over HTTP. The cause is not established, so full browser end-to-end compatibility is not yet confirmed. Browser analysis rendering was checked using data created over HTTP.

Dependencies were verified using pnpm with package.json version ranges and a hoisted layout, not `npm ci` against the supplied lockfile. Lint emits warnings. PDF/DOCX uploads and microphone capture were not end-to-end tested.

## Repository contents

- `backend/`: original supplied Python source and pipeline test.
- `frontend/`: original supplied React source, package manifest and npm lockfile.
- `requirements.txt`: dependency list added for setup; versions are unpinned.

Generated builds, caches, virtual environments, local environment files, and SQLite databases are excluded. Review CORS and secret configuration before deploying publicly.

## Cross-domain skill gaps

The engine includes 304 canonical skills spanning software, finance, healthcare, education, legal, engineering, logistics, HR, design, science, hospitality, marketing, and general business skills. Aliases map common abbreviations to canonical skills. For a niche skill outside this vocabulary, use an explicit comma-separated job-description list, for example `Required skills: Python, marine habitat mapping`.

The Skill Gaps page separates matched, partially evidenced, missing, and uncertain skills, shows evidence and required/preferred labels, and summarizes counts and next priorities. Education and experience requirements are excluded from skill counts. A skill merely listed in the resume is partial; a full match requires its name or alias in an original experience/project section. This remains heuristic text matching, not verification of professional competence or exhaustive coverage of every domain.

Run a new analysis to apply the expanded vocabulary and updated matching logic. Previously saved analyses retain their original results, but their skill requirements are grouped in the new UI.

Regression tests:

```sh
python -m unittest backend.test_skill_coverage
```

## HR workspace and acceptance emails

Sign in with **HR / Recruiter** selected, or open **HR Dashboard**. HR mode is an account-owned workspace, not an administrator role: authenticated users can create their own campaigns but cannot access other accounts’ campaigns. Existing accounts work; no special HR account is required.

1. Paste one JD or upload a PDF/DOCX/TXT JD.
2. Select up to 20 resumes (10 MB per document; 50 MB of resumes total).
3. Review the dashboard and extracted resume evidence. Strong match is >=80%, medium >=50%, low <50%; these are required-skill evidence scores, falling back to preferred skills when necessary. No recognized skills produces an unscored manual-review group. No applicant is automatically approved/rejected.
4. Approve, reject, or reset decisions. Check/correct each applicant's extracted email address.
5. Edit the acceptance message, preview recipients, confirm, then **Send acceptance emails**. Only approved applicants with valid addresses are eligible. Pending/rejected applicants and previously contacted addresses are excluded.

Configure SMTP in the backend environment before starting the server (or add these as Codespaces secrets and restart the Codespace):

```bash
export SMTP_HOST="smtp.your-provider.com"
export SMTP_PORT="587"
export SMTP_SECURITY="starttls"
export SMTP_FROM="careers@your-domain.com"
export SMTP_USERNAME="your-smtp-username"
# Set SMTP_PASSWORD using a secret, or enter it without echoing:
read -rs -p "SMTP password: " SMTP_PASSWORD; echo
export SMTP_PASSWORD
```

For implicit TLS, use `SMTP_SECURITY=ssl` and port 465. Use a verified sender and provider-issued SMTP credentials. `.env.example` documents the settings; the backend reads process environment variables and does not load .env automatically. Never put SMTP credentials in VITE_ variables or commit them. No new email-service dependency is needed.

Each recipient gets an individual email. Delivery state is saved; repeated sends skip already submitted messages. Failed connections can be retried after correcting configuration. If submission is uncertain (or a process stops while status is `sending`), check provider logs before retrying: these records are deliberately held, and an operator must reconcile their status in the database after checking delivery. “Sent” means SMTP accepted the email, not guaranteed inbox delivery. A later rejection does not recall a sent email.

A missing SMTP configuration shows a clear setup message and disables sending. This release was tested with mocked SMTP; no real applicant emails were sent.

Tests:

```bash
python -m unittest backend.test_hr backend.test_skill_coverage
```

The Career Lens rebrand migrates existing browser tokens and saved-analysis keys when the app next loads. Existing SQLite databases gain HR tables on startup without deleting previous analyses.

## Login/signup and Codespaces connection setup

Vite now proxies `/api` to the backend on `127.0.0.1:8000` automatically. The frontend defaults to same-origin API requests, and the Codespaces hostname is allowed automatically. No manual vite.config.js editing or forwarded API hostname is needed. Keep both servers running and open frontend port 5173.

If you previously exported an API address, override it with an empty value in the frontend terminal before starting Vite:

```bash
export VITE_API_BASE_URL=""
npm run dev
```

The empty value also overrides old `.env.local` values. Production hosting must route `/api` to FastAPI or provide a `VITE_API_BASE_URL` before building. For local troubleshooting:

```bash
curl -i http://127.0.0.1:8000/api/health
curl -i http://127.0.0.1:5173/api/health
```

Both should return JSON with `status: healthy`. If only the backend responds, restart Vite with the committed config. If neither responds, start the backend first. Connection errors now show HTTP status or backend-unavailable details instead of an uninformative unexpected-error message.

Frontend API error regression checks: `cd frontend && node test-api.mjs`.
