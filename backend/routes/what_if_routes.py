from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.database import get_db, json_loads
from backend.auth import get_current_user
from backend.engine import simulate_what_if

router = APIRouter(prefix="/api/analyses/{analysis_id}/what-if", tags=["What-If Simulator"])

class WhatIfRequest(BaseModel):
    new_skill: Optional[str] = None
    new_project: Optional[str] = None
    new_certification: Optional[str] = None

@router.post("")
def run_simulation(
    analysis_id: str,
    req: WhatIfRequest,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    if row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this analysis.")

    current_analysis_dict = {
        "assessment": row["assessment"],
        "required_coverage": row["required_coverage"],
        "preferred_coverage": row["preferred_coverage"],
        "requirements": json_loads(row["requirements"]) or [],
        "radar_data": json_loads(row["radar_data"]) or []
    }

    sim_result = simulate_what_if(
        current_analysis=current_analysis_dict,
        new_skill=req.new_skill,
        new_project=req.new_project,
        new_certification=req.new_certification
    )

    return sim_result
