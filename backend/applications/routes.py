from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from applications.schemas import ApplicationCreate, ApplicationResponse, ApplicationDetailResponse, ApplicationUpdate
from applications.ai_service import analyze_resume_match
from resume_parsing.models import Candidate
from job_management_module.models import Job
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/applications", tags=["Applications"], dependencies=[Depends(rate_limiter)])

# CANDIDATE ROUTES

@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    application: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Candidate applies for a job - triggers AI resume analysis"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot apply for jobs")
    
    # Check profile completion
    if not current_user.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your profile before applying")
    
    job = db.query(Job).filter(Job.id == application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=400, detail="Complete your profile before applying")
    
    if not candidate.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your profile (add experiences, education, skills)")
    
    existing = db.query(Application).filter(
        Application.job_id == application.job_id,
        Application.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
    
    new_application = Application(
        job_id=application.job_id,
        candidate_id=candidate.id,
        user_id=current_user.id,
        status=ApplicationStatus.PENDING
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    # AI analysis
    if candidate.parsed_data:
        job_data = {
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience_required": job.experience_required
        }
        
        analysis = await analyze_resume_match(candidate.parsed_data, job_data)
        
        new_application.resume_match_score = analysis.get("match_score", 0)
        new_application.resume_analysis = analysis
        new_application.status = ApplicationStatus.RESUME_SCREENED
        
        db.commit()
        db.refresh(new_application)
    
    return new_application


@router.get("/my-applications", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all applications submitted by the current candidate"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot access this endpoint")
    
    applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    
    return applications


@router.get("/my-applications/{application_id}", response_model=ApplicationDetailResponse)
def get_my_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific application"""
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        **ApplicationResponse.model_validate(application).model_dump(),
        "assessment_data": application.assessment_data,
        "interview_transcript": application.interview_transcript,
        "interview_feedback": application.interview_feedback,
        "job": {
            "id": application.job.id,
            "title": application.job.title,
            "description": application.job.description,
            "location": application.job.location
        } if application.job else None
    }


# HR ROUTES

@router.get("/job/{job_id}/applicants", response_model=List[ApplicationResponse])
def get_job_applicants(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get all applicants for a specific job"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    # Verify job belongs to this employer
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.resume_match_score.desc()).all()
    
    return applications


@router.get("/job/{job_id}/top-scorers")
def get_top_scorers(
    job_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get top scoring candidates for a job"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    top_applications = db.query(Application).filter(
        Application.job_id == job_id,
        Application.resume_match_score.isnot(None)
    ).order_by(Application.resume_match_score.desc()).limit(limit).all()
    
    return {
        "job_id": job_id,
        "job_title": job.title,
        "total_applicants": db.query(Application).filter(Application.job_id == job_id).count(),
        "top_scorers": [
            {
                "application_id": app.id,
                "candidate_id": app.candidate_id,
                "user_id": app.user_id,
                "resume_match_score": app.resume_match_score,
                "assessment_score": app.assessment_score,
                "interview_score": app.interview_score,
                "final_score": app.final_score,
                "status": app.status,
                "created_at": app.created_at
            }
            for app in top_applications
        ]
    }


@router.get("/application/{application_id}/detail", response_model=ApplicationDetailResponse)
def get_application_detail_hr(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get detailed application information"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify job belongs to this employer
    if application.job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    return {
        **ApplicationResponse.model_validate(application).model_dump(),
        "assessment_data": application.assessment_data,
        "interview_transcript": application.interview_transcript,
        "interview_feedback": application.interview_feedback,
        "job": {
            "id": application.job.id,
            "title": application.job.title,
            "description": application.job.description,
            "location": application.job.location
        } if application.job else None
    }


@router.patch("/application/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    update_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Update application status and add notes"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can update applications")
    
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify job belongs to this employer
    if application.job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only update applications for your jobs")
    
    if update_data.status:
        application.status = update_data.status
    if update_data.hr_notes:
        application.hr_notes = update_data.hr_notes
    
    db.commit()
    db.refresh(application)
    
    return application


@router.get("/dashboard/stats")
def get_hr_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get dashboard statistics"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    # Get all jobs by this employer
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [job.id for job in jobs]
    
    total_applications = db.query(Application).filter(Application.job_id.in_(job_ids)).count()
    pending_review = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.PENDING
    ).count()
    
    screened = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.RESUME_SCREENED
    ).count()
    
    in_assessment = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status.in_([ApplicationStatus.ASSESSMENT_SCHEDULED, ApplicationStatus.ASSESSMENT_COMPLETED])
    ).count()
    
    in_interview = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status.in_([ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.INTERVIEW_COMPLETED])
    ).count()
    
    return {
        "total_jobs": len(jobs),
        "total_applications": total_applications,
        "pending_review": pending_review,
        "screened": screened,
        "in_assessment": in_assessment,
        "in_interview": in_interview
    }
