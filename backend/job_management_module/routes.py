from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from .models import Job
from job_management_module.schemas import JobCreate, JobUpdate, JobResponse, JobWithCompanyResponse
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/jobs", tags=["Jobs"], dependencies=[Depends(rate_limiter)])


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Create a new job posting"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can create jobs")
    
    if not current_user.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your company profile first")
    
    new_job = Job(
        title=job.title,
        description=job.description,
        required_skills=job.required_skills,
        experience_required=job.experience_required,
        location=job.location,
        salary_range=job.salary_range,
        created_by=current_user.id
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return new_job


@router.get("/", response_model=List[JobWithCompanyResponse])
def get_all_jobs(db: Session = Depends(get_db)):
    """Get all active job postings with company info"""
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    
    result = []
    for job in jobs:
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
            "company_name": job.employer.company_name,
            "company_website": job.employer.company_website
        }
        result.append(job_dict)
    
    return result


@router.get("/my-jobs", response_model=List[JobResponse])
def get_my_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get all jobs created by current employer"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/{job_id}", response_model=JobWithCompanyResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get specific job details with company info"""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills,
        "experience_required": job.experience_required,
        "location": job.location,
        "salary_range": job.salary_range,
        "created_by": job.created_by,
        "created_at": job.created_at,
        "company_name": job.employer.company_name,
        "company_website": job.employer.company_website
    }


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Update job posting (only creator can update)"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can update jobs")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only update your own jobs")
    
    for key, value in job_update.dict(exclude_unset=True).items():
        setattr(job, key, value)
    
    db.commit()
    db.refresh(job)
    
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Delete job posting (only creator can delete)"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can delete jobs")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only delete your own jobs")
    
    db.delete(job)
    db.commit()
    
    return None
