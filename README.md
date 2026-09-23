# Resume Evaluation System

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
