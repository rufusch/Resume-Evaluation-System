import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.database import get_db, json_dumps, json_loads
from backend.auth import get_current_user
from backend.engine import evaluate_interview_answer

router = APIRouter(prefix="/api/analyses/{analysis_id}/interview", tags=["Interview"])

class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer_text: str
    speech_metrics: Optional[Dict[str, Any]] = None

@router.post("/answer")
def submit_answer(
    analysis_id: str,
    req: SubmitAnswerRequest,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, interview_questions FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    if row["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this analysis."
        )

    questions = json_loads(row["interview_questions"]) or []
    target_q = next((q for q in questions if q["id"] == req.question_id), None)
    if not target_q:
        target_q = {"id": req.question_id, "question": "Interview Question", "suggested_focus": []}

    evaluation = evaluate_interview_answer(target_q, req.answer_text, req.speech_metrics)

    # Save answer
    answer_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO interview_answers (id, analysis_id, question_id, answer_text, speech_metrics, evaluation)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        answer_id,
        analysis_id,
        req.question_id,
        req.answer_text,
        json_dumps(req.speech_metrics) if req.speech_metrics else None,
        json_dumps(evaluation)
    ))
    conn.commit()
    conn.close()

    return {
        "answer_id": answer_id,
        "question_id": req.question_id,
        "evaluation": evaluation
    }

@router.get("/summary")
def get_interview_summary(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, job_title FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    if row["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this analysis.")

    cursor.execute("""
        SELECT question_id, answer_text, speech_metrics, evaluation
        FROM interview_answers
        WHERE analysis_id = ?
        ORDER BY created_at ASC
    """, (analysis_id,))
    ans_rows = cursor.fetchall()
    conn.close()

    answers = []
    has_speech = False
    for r in ans_rows:
        speech = json_loads(r["speech_metrics"])
        if speech:
            has_speech = True
        answers.append({
            "question_id": r["question_id"],
            "answer_text": r["answer_text"],
            "speech_metrics": speech,
            "evaluation": json_loads(r["evaluation"])
        })

    ans_count = len(answers)
    return {
        "questions_attempted": ans_count,
        "technical_depth": "Strong architectural logic and concrete reasoning demonstrated across responses." if ans_count >= 3 else "Initial answers show promising technical awareness; practice expanding on edge cases.",
        "communication": "Clear articulation with structured answers." + (" Observable speech delivery maintained consistent conversational pacing." if has_speech else ""),
        "completeness": f"Answered {ans_count} questions. Key trade-offs and methodologies were directly addressed.",
        "role_understanding": f"High alignment with day-to-day responsibilities required for the {row['job_title']} role.",
        "areas_to_revise": [
            "Quantify project outcomes with numerical metrics (e.g. latency, memory, team velocity).",
            "Be prepared for follow-up cross-examination on distributed failure scenarios.",
            "Use the STAR framework (Situation, Task, Action, Result) to anchor scenario questions."
        ],
        "answers": answers
    }
