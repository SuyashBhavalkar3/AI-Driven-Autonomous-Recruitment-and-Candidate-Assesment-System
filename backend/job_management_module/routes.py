from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from authentication.database import SessionLocal, get_db
from authentication.utils import get_current_user
from authentication.models import User
from .models import Job
from applications.models import Application
from job_management_module.schemas import JobCreate, JobUpdate
from fastapi import HTTPException
from typing import List

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/create")
def create_job(job: JobCreate, db: Session = Depends(get_db)):

    new_job = Job(
        title=job.title,
        description=job.description,
        required_skills=job.required_skills,
        experience_required=job.experience_required,
        location=job.location,
        salary_range=job.salary_range,
        created_by=1   # employer id (temporary)
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "message": "Job created successfully",
        "job": new_job
    }




@router.get("/")
def get_all_jobs(db: Session = Depends(get_db)):
    """Get all jobs with application counts and company info"""
    
    # Load jobs with employer relationship
    jobs = db.query(Job).options(joinedload(Job.employer)).all()
    
    # Enhance jobs with application counts and company info
    enhanced_jobs = []
    for job in jobs:
        # Count applications for this job
        application_count = db.query(Application).filter(Application.job_id == job.id).count()
        
        job_dict = {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience_required": job.experience_required,
            "location": job.location,
            "salary_range": job.salary_range,
            "created_by": job.created_by,
            "created_at": job.created_at,
            "application_count": application_count
        }
        
        # Add company info if available
        if job.employer:
            job_dict["company"] = {
                "name": job.employer.company_name or job.employer.name,
                "website": job.employer.company_website
            }
        else:
            job_dict["company"] = {
                "name": "Unknown Company",
                "website": None
            }
        
        enhanced_jobs.append(job_dict)

    return {"total_jobs": len(jobs), "jobs": enhanced_jobs}



@router.get("/my-jobs")
def get_my_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get jobs created by current HR user with application statistics"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    
    # Enhance jobs with detailed application statistics
    enhanced_jobs = []
    for job in jobs:
        # Get application statistics
        total_applications = db.query(Application).filter(Application.job_id == job.id).count()
        pending_applications = db.query(Application).filter(
            Application.job_id == job.id,
            Application.status.in_(["pending", "resume_screened"])
        ).count()
        assessment_stage = db.query(Application).filter(
            Application.job_id == job.id,
            Application.status.in_(["assessment_scheduled", "assessment_completed"])
        ).count()
        interview_stage = db.query(Application).filter(
            Application.job_id == job.id,
            Application.status.in_(["interview_scheduled", "interview_completed"])
        ).count()
        
        job_dict = {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience_required": job.experience_required,
            "location": job.location,
            "salary_range": job.salary_range,
            "created_at": job.created_at,
            "application_stats": {
                "total_applications": total_applications,
                "pending_review": pending_applications,
                "in_assessment": assessment_stage,
                "in_interview": interview_stage
            }
        }
        
        enhanced_jobs.append(job_dict)
    
    return {
        "total_jobs": len(jobs),
        "jobs": enhanced_jobs
    }


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a single job with company information"""
    
    job = db.query(Job).options(joinedload(Job.employer)).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Convert to dict with company info
    job_dict = {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills,
        "experience_required": job.experience_required,
        "location": job.location,
        "salary_range": job.salary_range,
        "created_by": job.created_by,
        "created_at": job.created_at
    }
    
    # Add company info if available
    if job.employer:
        job_dict["company"] = {
            "name": job.employer.company_name or job.employer.name,
            "website": job.employer.company_website
        }
    else:
        job_dict["company"] = {
            "name": "Unknown Company",
            "website": None
        }
    
    return job_dict



@router.put("/{job_id}")
def update_job(job_id: int, job_update: JobUpdate, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in job_update.dict(exclude_unset=True).items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)

    return {"message": "Job updated", "job": job}



@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}