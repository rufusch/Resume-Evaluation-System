import sqlite3
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List

DB_PATH = Path(os.environ.get("DATABASE_PATH", Path(__file__).parent / "ai_career.db"))

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Analyses table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        job_title TEXT NOT NULL,
        company TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resume_filename TEXT NOT NULL,
        resume_text TEXT NOT NULL,
        jd_text TEXT NOT NULL,
        assessment TEXT NOT NULL,
        required_coverage INTEGER NOT NULL DEFAULT 0,
        preferred_coverage INTEGER NOT NULL DEFAULT 0,
        candidate_profile TEXT NOT NULL,
        job_profile TEXT NOT NULL,
        requirements TEXT NOT NULL,
        resume_insights TEXT NOT NULL,
        projects TEXT NOT NULL,
        skill_gaps TEXT NOT NULL,
        radar_data TEXT NOT NULL,
        career_brief TEXT NOT NULL,
        interview_questions TEXT NOT NULL,
        what_if_state TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # Interview answers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_answers (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        answer_text TEXT NOT NULL,
        speech_metrics TEXT,
        evaluation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
    )
    """)
    
    from backend.hr import init_hr_db
    init_hr_db(conn)
    conn.commit()
    conn.close()

# Helper serializer
def json_dumps(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False)

def json_loads(data: Optional[str]) -> Any:
    if not data:
        return None
    try:
        return json.loads(data)
    except Exception:
        return None
