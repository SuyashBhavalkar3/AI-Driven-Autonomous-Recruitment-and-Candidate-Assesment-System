from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/proctoring", tags=["Proctoring"], dependencies=[Depends(rate_limiter)])

class ViolationReport(BaseModel):
    application_id: int
    violation_type: str  # face_not_detected, multiple_faces, tab_switch, etc.
    timestamp: str
    details: str

@router.post("/report-violation")
def report_violation(
    data: ViolationReport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == data.application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Store violation in assessment/interview data
    violations = app.assessment_data.get("violations", []) if app.assessment_data else []
    violations.append({
        "type": data.violation_type,
        "timestamp": data.timestamp,
        "details": data.details
    })
    
    if not app.assessment_data:
        app.assessment_data = {}
    app.assessment_data["violations"] = violations
    
    # Auto-fail if critical violations
    critical_violations = ["multiple_faces", "impersonation", "external_help"]
    if data.violation_type in critical_violations:
        app.status = ApplicationStatus.REJECTED
        app.hr_notes = f"Auto-rejected: Proctoring violation - {data.violation_type}"
    
    db.commit()
    return {"message": "Violation reported", "auto_rejected": data.violation_type in critical_violations}

@router.get("/violations/{application_id}")
def get_violations(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check authorization
    if current_user.is_employer:
        if app.job.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    else:
        if app.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    violations = app.assessment_data.get("violations", []) if app.assessment_data else []
    return {"violations": violations}
