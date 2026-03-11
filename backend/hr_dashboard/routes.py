from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from job_management_module.models import Job
from middleware.rate_limiter import rate_limiter
from datetime import datetime, timedelta

router = APIRouter(prefix="/v1/hr/dashboard", tags=["HR Dashboard"], dependencies=[Depends(rate_limiter)])

@router.get("/stats")
def get_hr_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    # Get all jobs created by this HR user
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    print(f"HR User ID: {current_user.id}")
    print(f"Jobs found: {len(jobs)}")
    print(f"Job IDs: {job_ids}")
    
    total_jobs = len(jobs)
    
    # Get all applications for these jobs
    all_applications = db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
    total_apps = len(all_applications)
    
    print(f"Total applications found: {total_apps}")
    print(f"Application statuses: {[app.status for app in all_applications]}")
    
    # Count by status
    pending = len([app for app in all_applications if app.status == ApplicationStatus.PENDING])
    
    in_assessment = len([app for app in all_applications if app.status in [
        ApplicationStatus.ASSESSMENT_SCHEDULED, 
        ApplicationStatus.ASSESSMENT_COMPLETED
    ]])
    
    in_interview = len([app for app in all_applications if app.status in [
        ApplicationStatus.INTERVIEW_SCHEDULED, 
        ApplicationStatus.INTERVIEW_COMPLETED
    ]])
    
    hired = len([app for app in all_applications if app.status == ApplicationStatus.ACCEPTED])
    
    rejected = len([app for app in all_applications if app.status == ApplicationStatus.REJECTED])
    
    # Monthly stats
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    hired_this_month = len([app for app in all_applications 
                           if app.status == ApplicationStatus.ACCEPTED and 
                           app.updated_at and app.updated_at >= thirty_days_ago])
    
    apps_this_month = len([app for app in all_applications 
                          if app.created_at and app.created_at >= thirty_days_ago])
    
    result = {
        "total_jobs": total_jobs,
        "total_applications": total_apps,
        "pending_review": pending,
        "in_assessment": in_assessment,
        "in_interview": in_interview,
        "hired_total": hired,
        "rejected": rejected,
        "hired_this_month": hired_this_month,
        "applications_this_month": apps_this_month
    }
    
    print(f"Stats result: {result}")
    return result

@router.get("/recent-applicants")
def get_recent_applicants(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    if not job_ids:
        return []
    
    # Join Application with Candidate and User to get all data in one query
    from resume_parsing.models import Candidate
    
    apps = db.query(Application, Candidate, User).join(
        Candidate, Application.candidate_id == Candidate.id
    ).join(
        User, Candidate.user_id == User.id
    ).filter(
        Application.job_id.in_(job_ids)
    ).order_by(Application.created_at.desc()).limit(limit).all()
    
    result = []
    for app, candidate, user in apps:
        result.append({
            "id": app.id,
            "candidate_id": app.candidate_id,
            "candidate_name": user.name or f"Candidate #{app.candidate_id}",
            "candidate_email": user.email or "",
            "job_title": app.job.title,
            "status": app.status,
            "resume_score": app.resume_match_score,
            "assessment_score": app.assessment_score,
            "interview_score": app.interview_score,
            "final_score": app.final_score,
            "applied_at": app.created_at
        })
    
    return result

@router.get("/top-candidates")
def get_top_candidates(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    apps = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.resume_match_score.isnot(None)
    ).order_by(Application.resume_match_score.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "candidate_id": a.candidate_id,
        "job_title": a.job.title,
        "status": a.status,
        "resume_score": a.resume_match_score,
        "assessment_score": a.assessment_score,
        "interview_score": a.interview_score,
        "final_score": a.final_score
    } for a in apps]

@router.post("/fix-job-ownership")
def fix_job_ownership(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fix job ownership - assign all jobs to current user"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can fix job ownership")
    
    try:
        # Get all jobs that don't belong to current user
        orphaned_jobs = db.query(Job).filter(Job.created_by != current_user.id).all()
        
        # Update them to belong to current user
        updated_count = 0
        for job in orphaned_jobs:
            job.created_by = current_user.id
            updated_count += 1
        
        db.commit()
        
        return {
            "message": f"Fixed ownership of {updated_count} jobs",
            "updated_jobs": updated_count,
            "current_user_id": current_user.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to fix job ownership: {str(e)}")
def debug_database_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to see what data exists in the database"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    # Get all jobs
    all_jobs = db.query(Job).all()
    user_jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    
    # Get all applications
    all_applications = db.query(Application).all()
    
    return {
        "current_user_id": current_user.id,
        "current_user_is_employer": current_user.is_employer,
        "total_jobs_in_db": len(all_jobs),
        "user_jobs_count": len(user_jobs),
        "user_job_ids": [job.id for job in user_jobs],
        "user_job_titles": [job.title for job in user_jobs],
        "total_applications_in_db": len(all_applications),
        "applications_for_user_jobs": len([app for app in all_applications if app.job_id in [job.id for job in user_jobs]]),
        "all_job_created_by_values": list(set([job.created_by for job in all_jobs])),
        "sample_applications": [{
            "id": app.id,
            "job_id": app.job_id,
            "status": app.status,
            "candidate_id": app.candidate_id
        } for app in all_applications[:5]]  # First 5 applications
    }
def get_pending_actions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    pending_review = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.PENDING
    ).all()
    
    assessment_completed = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.ASSESSMENT_COMPLETED
    ).all()
    
    interview_completed = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.INTERVIEW_COMPLETED
    ).all()
    
    return {
        "pending_review": [{
            "id": a.id,
            "job_title": a.job.title,
            "candidate_id": a.candidate_id,
            "applied_at": a.created_at
        } for a in pending_review],
        "assessment_completed": [{
            "id": a.id,
            "job_title": a.job.title,
            "candidate_id": a.candidate_id,
            "assessment_score": a.assessment_score
        } for a in assessment_completed],
        "interview_completed": [{
            "id": a.id,
            "job_title": a.job.title,
            "candidate_id": a.candidate_id,
            "interview_score": a.interview_score
        } for a in interview_completed]
    }
