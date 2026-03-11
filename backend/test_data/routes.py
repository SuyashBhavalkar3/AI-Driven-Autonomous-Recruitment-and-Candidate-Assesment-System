from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from job_management_module.models import Job
from applications.models import Application, ApplicationStatus
from resume_parsing.models import Candidate
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/v1/test", tags=["Test Data"])

@router.post("/create-sample-data")
def create_sample_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create sample jobs and applications for testing HR dashboard"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can create test data")
    
    try:
        # Create sample jobs
        sample_jobs = [
            {
                "title": "Senior Frontend Developer",
                "description": "Looking for an experienced React developer",
                "requirements": "5+ years React, TypeScript, Node.js",
                "location": "Remote",
                "salary_min": 80000,
                "salary_max": 120000,
                "job_type": "full_time",
                "status": "active"
            },
            {
                "title": "Backend Engineer",
                "description": "Python/Django backend developer needed",
                "requirements": "3+ years Python, Django, PostgreSQL",
                "location": "New York",
                "salary_min": 70000,
                "salary_max": 100000,
                "job_type": "full_time",
                "status": "active"
            },
            {
                "title": "DevOps Engineer",
                "description": "AWS/Docker infrastructure specialist",
                "requirements": "AWS, Docker, Kubernetes, CI/CD",
                "location": "San Francisco",
                "salary_min": 90000,
                "salary_max": 130000,
                "job_type": "full_time",
                "status": "active"
            }
        ]
        
        created_jobs = []
        for job_data in sample_jobs:
            job = Job(
                title=job_data["title"],
                description=job_data["description"],
                requirements=job_data["requirements"],
                location=job_data["location"],
                salary_min=job_data["salary_min"],
                salary_max=job_data["salary_max"],
                job_type=job_data["job_type"],
                status=job_data["status"],
                created_by=current_user.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            )
            db.add(job)
            created_jobs.append(job)
        
        db.commit()
        
        # Create sample candidate users and candidates
        sample_candidates = [
            {"name": "John Smith", "email": "john.smith@example.com"},
            {"name": "Sarah Johnson", "email": "sarah.johnson@example.com"},
            {"name": "Michael Brown", "email": "michael.brown@example.com"},
            {"name": "Emily Davis", "email": "emily.davis@example.com"},
            {"name": "David Wilson", "email": "david.wilson@example.com"},
            {"name": "Lisa Anderson", "email": "lisa.anderson@example.com"},
            {"name": "James Taylor", "email": "james.taylor@example.com"},
            {"name": "Jennifer Martinez", "email": "jennifer.martinez@example.com"},
            {"name": "Robert Garcia", "email": "robert.garcia@example.com"},
            {"name": "Amanda Rodriguez", "email": "amanda.rodriguez@example.com"},
        ]
        
        created_candidates = []
        for candidate_data in sample_candidates:
            # Create user first
            user = User(
                name=candidate_data["name"],
                email=candidate_data["email"],
                password_hash="dummy_hash",
                is_employer=False,
                created_at=datetime.utcnow() - timedelta(days=random.randint(30, 90))
            )
            db.add(user)
            db.flush()
            
            # Create candidate profile
            candidate = Candidate(
                user_id=user.id,
                phone=f"+1-555-{random.randint(1000, 9999)}",
                linkedin_url=f"https://linkedin.com/in/{candidate_data['name'].lower().replace(' ', '-')}",
                resume_url=f"https://example.com/resumes/{user.id}.pdf",
                location=random.choice(["New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA", "Remote"]),
                profile_completed=True,
                created_at=datetime.utcnow() - timedelta(days=random.randint(20, 80))
            )
            db.add(candidate)
            created_candidates.append(candidate)
        
        db.commit()
        
        # Create sample applications
        statuses = [
            ApplicationStatus.PENDING,
            ApplicationStatus.ASSESSMENT_SCHEDULED,
            ApplicationStatus.ASSESSMENT_COMPLETED,
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_COMPLETED,
            ApplicationStatus.ACCEPTED,
            ApplicationStatus.REJECTED
        ]
        
        created_applications = []
        for job in created_jobs:
            # Create 3-8 applications per job
            num_apps = random.randint(3, 8)
            selected_candidates = random.sample(created_candidates, min(num_apps, len(created_candidates)))
            
            for candidate in selected_candidates:
                application = Application(
                    job_id=job.id,
                    candidate_id=candidate.id,
                    user_id=candidate.user_id,
                    status=random.choice(statuses),
                    resume_match_score=random.randint(60, 95),
                    assessment_score=random.randint(50, 90) if random.random() > 0.3 else None,
                    interview_score=random.randint(60, 95) if random.random() > 0.5 else None,
                    final_score=random.randint(65, 90) if random.random() > 0.7 else None,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 20)),
                    updated_at=datetime.utcnow() - timedelta(days=random.randint(0, 10))
                )
                db.add(application)
                created_applications.append(application)
        
        db.commit()
        
        return {
            "message": "Sample data created successfully",
            "jobs_created": len(created_jobs),
            "candidates_created": len(created_candidates),
            "applications_created": len(created_applications),
            "job_titles": [job.title for job in created_jobs],
            "candidate_names": [c.user.name for c in created_candidates]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create sample data: {str(e)}")

@router.delete("/clear-sample-data")
def clear_sample_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all jobs and applications created by current user"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can clear test data")
    
    try:
        # Get user's jobs
        user_jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
        job_ids = [job.id for job in user_jobs]
        
        # Delete applications for these jobs
        applications_deleted = db.query(Application).filter(Application.job_id.in_(job_ids)).delete()
        
        # Delete jobs
        jobs_deleted = db.query(Job).filter(Job.created_by == current_user.id).delete()
        
        db.commit()
        
        return {
            "message": "Sample data cleared successfully",
            "jobs_deleted": jobs_deleted,
            "applications_deleted": applications_deleted
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear sample data: {str(e)}")