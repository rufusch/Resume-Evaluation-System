import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from backend.database import get_db, json_dumps, json_loads
from backend.auth import get_current_user
from backend.parser import extract_text_from_file
from backend.engine import parse_resume_content, parse_job_description, analyze_match

router = APIRouter(prefix="/api/analyses", tags=["Analyses"])

@router.post("/upload")
async def upload_and_analyze(
    resume_file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    # 1. Validate inputs
    if not resume_file or not resume_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a resume file (PDF, DOC, DOCX, or TXT)."
        )

    resume_bytes = await resume_file.read()
    if not resume_bytes or len(resume_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded resume file is empty. Please upload a valid document."
        )

    try:
        extracted_resume = extract_text_from_file(resume_bytes, resume_file.filename)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Extract Job Description text
    extracted_jd = ""
    if jd_file and jd_file.filename:
        jd_bytes = await jd_file.read()
        if jd_bytes and len(jd_bytes) > 0:
            try:
                extracted_jd = extract_text_from_file(jd_bytes, jd_file.filename)
            except ValueError as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Job Description file error: {str(e)}")

    if not extracted_jd and jd_text:
        extracted_jd = jd_text.strip()

    if not extracted_jd or len(extracted_jd) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add a job description (at least a few sentences) before continuing."
        )

    # 2. Run Engine Analysis
    try:
        resume_data = parse_resume_content(extracted_resume)
        jd_data = parse_job_description(extracted_jd)
        analysis_result = analyze_match(extracted_resume, extracted_jd, resume_data, jd_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"We couldn't complete the analysis. Please try again. ({str(e)})"
        )

    analysis_id = str(uuid.uuid4())

    # 3. Persist Analysis in DB
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analyses (
            id, user_id, job_title, company, status, resume_filename,
            resume_text, jd_text, assessment, required_coverage, preferred_coverage,
            candidate_profile, job_profile, requirements, resume_insights,
            projects, skill_gaps, radar_data, career_brief, interview_questions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        current_user["id"],
        jd_data.get("job_title", "Target Role"),
        jd_data.get("company", "Hiring Organization"),
        "completed",
        resume_file.filename,
        extracted_resume,
        extracted_jd,
        analysis_result["assessment"],
        analysis_result["required_coverage"],
        analysis_result["preferred_coverage"],
        json_dumps(analysis_result["candidate_profile"]),
        json_dumps(analysis_result["job_profile"]),
        json_dumps(analysis_result["requirements"]),
        json_dumps(analysis_result["resume_insights"]),
        json_dumps(analysis_result["projects"]),
        json_dumps(analysis_result["skill_gaps"]),
        json_dumps(analysis_result["radar_data"]),
        json_dumps(analysis_result["career_brief"]),
        json_dumps(analysis_result["interview_questions"])
    ))
    conn.commit()
    conn.close()

    return {
        "analysis_id": analysis_id,
        "status": "completed",
        "job_title": jd_data.get("job_title"),
        "company": jd_data.get("company"),
        "assessment": analysis_result["assessment"],
        "required_coverage": analysis_result["required_coverage"],
        "preferred_coverage": analysis_result["preferred_coverage"]
    }

@router.get("/{analysis_id}/status")
def get_analysis_status(analysis_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, status FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    if row["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this analysis."
        )

    return {
        "analysis_id": analysis_id,
        "status": row["status"],
        "steps": [
            {"id": "upload", "label": "Resume uploaded", "completed": True},
            {"id": "extract", "label": "Resume text extracted", "completed": True},
            {"id": "jd_reqs", "label": "Job requirements identified", "completed": True},
            {"id": "match", "label": "Matching skills with evidence", "completed": True},
            {"id": "recruiter", "label": "Analyzing recruiter visibility", "completed": True},
            {"id": "career", "label": "Preparing career insights", "completed": True}
        ]
    }

@router.get("")
def list_my_analyses(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, job_title, company, status, created_at,
               assessment, required_coverage, preferred_coverage, resume_filename
        FROM analyses
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    analyses = []
    for r in rows:
        analyses.append({
            "id": r["id"],
            "job_title": r["job_title"],
            "company": r["company"],
            "status": r["status"],
            "created_at": r["created_at"],
            "assessment": r["assessment"],
            "required_coverage": r["required_coverage"],
            "preferred_coverage": r["preferred_coverage"],
            "resume_filename": r["resume_filename"]
        })
    return {"analyses": analyses}

@router.get("/{analysis_id}")
def get_analysis_detail(analysis_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found."
        )

    # STRICT USER OWNERSHIP ENFORCEMENT
    if row["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this analysis."
        )

    return {
        "analysis_id": row["id"],
        "user_id": row["user_id"],
        "job_title": row["job_title"],
        "company": row["company"],
        "status": row["status"],
        "created_at": row["created_at"],
        "resume_filename": row["resume_filename"],
        "assessment": row["assessment"],
        "required_coverage": row["required_coverage"],
        "preferred_coverage": row["preferred_coverage"],
        "candidate_profile": json_loads(row["candidate_profile"]),
        "job_profile": json_loads(row["job_profile"]),
        "requirements": json_loads(row["requirements"]),
        "resume_insights": json_loads(row["resume_insights"]),
        "projects": json_loads(row["projects"]),
        "skill_gaps": json_loads(row["skill_gaps"]),
        "radar_data": json_loads(row["radar_data"]),
        "career_brief": json_loads(row["career_brief"]),
        "interview_questions": json_loads(row["interview_questions"]),
        "what_if_state": json_loads(row["what_if_state"])
    }

@router.delete("/{analysis_id}")
def delete_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM analyses WHERE id = ?", (analysis_id,))
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

    cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    conn.commit()
    conn.close()

    return {"message": "Analysis deleted successfully.", "analysis_id": analysis_id}
