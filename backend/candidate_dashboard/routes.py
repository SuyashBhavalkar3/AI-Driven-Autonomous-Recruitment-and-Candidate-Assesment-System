from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from notifications.models import Notification
from middleware.rate_limiter import rate_limiter
from datetime import datetime, timedelta

router = APIRouter(prefix="/v1/candidate/dashboard", tags=["Candidate Dashboard"], dependencies=[Depends(rate_limiter)])

@router.get("/stats")
def get_candidate_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access")
    
    total = db.query(Application).filter(Application.user_id == current_user.id).count()
    
    in_progress = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status.in_([ApplicationStatus.ASSESSMENT_SCHEDULED, ApplicationStatus.INTERVIEW_SCHEDULED])
    ).count()
    
    offers = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status == ApplicationStatus.ACCEPTED
    ).count()
    
    rejected = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status == ApplicationStatus.REJECTED
    ).count()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.created_at >= thirty_days_ago
    ).count()
    
    avg_resume = db.query(func.avg(Application.resume_match_score)).filter(
        Application.user_id == current_user.id,
        Application.resume_match_score.isnot(None)
    ).scalar() or 0
    
    avg_assessment = db.query(func.avg(Application.assessment_score)).filter(
        Application.user_id == current_user.id,
        Application.assessment_score.isnot(None)
    ).scalar() or 0
    
    unread = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {
        "total_applications": total,
        "in_progress": in_progress,
        "offers_received": offers,
        "rejected": rejected,
        "recent_30d": recent,
        "avg_resume_score": round(avg_resume, 2),
        "avg_assessment_score": round(avg_assessment, 2),
        "unread_notifications": unread
    }

@router.get("/activity")
def get_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access")
    
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.updated_at.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "job_title": a.job.title,
        "company": a.job.company_name,
        "status": a.status,
        "updated_at": a.updated_at,
        "resume_score": a.resume_match_score,
        "assessment_score": a.assessment_score
    } for a in apps]
