from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
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

def get_application_status_display(application: Application) -> dict:
    """Get user-friendly status display for application"""
    status = application.status
    score = application.resume_match_score
    assessment_score = application.assessment_score
    
    if status == ApplicationStatus.PENDING:
        return {
            "status": "Under Review",
            "description": "Your application is being reviewed",
            "action": None
        }
    elif status == ApplicationStatus.RESUME_SCREENED:
        if score and score >= 20:
            return {
                "status": "Assessment Available",
                "description": f"Resume screening passed ({score:.0f}%). Take your assessment now!",
                "action": "take_assessment"
            }
        else:
            return {
                "status": "Not Qualified",
                "description": "Resume screening did not meet minimum requirements",
                "action": None
            }
    elif status == ApplicationStatus.ASSESSMENT_SCHEDULED:
        return {
            "status": "Assessment Available",
            "description": "Your assessment is ready. Click to start!",
            "action": "take_assessment"
        }
    elif status == ApplicationStatus.ASSESSMENT_COMPLETED:
        if assessment_score and assessment_score >= 70:
            return {
                "status": "Interview Scheduled",
                "description": f"Assessment passed ({assessment_score:.0f}%). Interview available!",
                "action": "take_interview"
            }
        else:
            return {
                "status": "Assessment Failed",
                "description": f"Assessment score ({assessment_score:.0f}%) below required 70%",
                "action": None
            }
    elif status == ApplicationStatus.INTERVIEW_SCHEDULED:
        return {
            "status": "Interview Available",
            "description": "Your interview is ready. Click to start!",
            "action": "take_interview"
        }
    elif status == ApplicationStatus.INTERVIEW_COMPLETED:
        return {
            "status": "Interview Completed",
            "description": "Waiting for final decision",
            "action": None
        }
    elif status == ApplicationStatus.ACCEPTED:
        return {
            "status": "Accepted",
            "description": "Congratulations! You've been selected",
            "action": None
        }
    elif status == ApplicationStatus.REJECTED:
        return {
            "status": "Not Selected",
            "description": "Thank you for your interest",
            "action": None
        }
    else:
        return {
            "status": "Under Review",
            "description": "Your application is being processed",
            "action": None
        }

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
    
    candidate = db.query(Candidate).options(
        joinedload(Candidate.skills),
        joinedload(Candidate.experiences),
        joinedload(Candidate.education),
        joinedload(Candidate.projects)
    ).filter(Candidate.user_id == current_user.id).first()
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
        
        print(f"Analyzing resume for user {current_user.id}:")
        print(f"   Job: {job.title}")
        print(f"   Required skills: {job.required_skills}")
        print(f"   Candidate data keys: {list(candidate.parsed_data.keys()) if candidate.parsed_data else 'None'}")
        
        # Pass both parsed_data and candidate object for comprehensive analysis
        analysis = await analyze_resume_match(candidate.parsed_data, job_data, candidate)
        
        print(f"   Analysis result: {analysis}")
        
        new_application.resume_match_score = analysis.get("match_score", 20)  # Default to 20 if no score
        new_application.resume_analysis = analysis
        new_application.status = ApplicationStatus.RESUME_SCREENED
        
        db.commit()
        db.refresh(new_application)
    else:
        print(f"No parsed data for candidate {candidate.id}, analyzing structured data only")
        # Even without parsed data, analyze structured data from database
        job_data = {
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience_required": job.experience_required
        }
        
        # Pass empty dict as parsed_data but include candidate object
        analysis = await analyze_resume_match({}, job_data, candidate)
        
        new_application.resume_match_score = analysis.get("match_score", 20)
        new_application.resume_analysis = analysis
        new_application.status = ApplicationStatus.RESUME_SCREENED
        
        db.commit()
        db.refresh(new_application)
    
    # Return properly formatted response
    response_data = {
        "id": new_application.id,
        "job_id": new_application.job_id,
        "candidate_id": new_application.candidate_id,
        "user_id": new_application.user_id,
        "status": new_application.status,
        "resume_match_score": new_application.resume_match_score,
        "resume_analysis": new_application.resume_analysis,
        "assessment_score": new_application.assessment_score,
        "interview_score": new_application.interview_score,
        "final_score": new_application.final_score,
        "hr_notes": new_application.hr_notes,
        "created_at": new_application.created_at
    }
    
    return response_data


@router.get("/my-applications")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all applications submitted by the current candidate with job and company details"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot access this endpoint")
    
    applications = db.query(Application).options(
        joinedload(Application.job).joinedload(Job.employer),
        joinedload(Application.candidate),
        joinedload(Application.user)
    ).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    
    # Enhance applications with job and company details
    enhanced_applications = []
    for app in applications:
        print(f"\n=== Processing application {app.id} ===")
        print(f"  Status: {app.status}")
        print(f"  Job exists: {app.job is not None}")
        if app.job:
            print(f"  Job title: {app.job.title}")
            print(f"  Job location: {app.job.location}")
            print(f"  Employer exists: {app.job.employer is not None}")
            if app.job.employer:
                print(f"  Company name: {app.job.employer.company_name}")
                print(f"  Employer name: {app.job.employer.name}")
        
        # Convert application to dict manually
        app_dict = {
            "id": app.id,
            "job_id": app.job_id,
            "candidate_id": app.candidate_id,
            "user_id": app.user_id,
            "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
            "resume_match_score": app.resume_match_score,
            "resume_analysis": app.resume_analysis,
            "assessment_score": app.assessment_score,
            "interview_score": app.interview_score,
            "final_score": app.final_score,
            "hr_notes": app.hr_notes,
            "created_at": app.created_at.isoformat() if app.created_at else None
        }
        
        # Add job details
        if app.job:
            app_dict["job"] = {
                "id": app.job.id,
                "title": app.job.title,
                "description": app.job.description,
                "location": app.job.location,
                "salary_range": app.job.salary_range,
                "required_skills": app.job.required_skills
            }
            
            # Add company details from employer
            if app.job.employer:
                app_dict["company"] = {
                    "name": app.job.employer.company_name or app.job.employer.name,
                    "website": app.job.employer.company_website,
                    "description": app.job.employer.company_description
                }
            else:
                app_dict["company"] = {
                    "name": "Unknown Company",
                    "website": None,
                    "description": None
                }
        else:
            app_dict["job"] = None
            app_dict["company"] = {
                "name": "Unknown Company",
                "website": None,
                "description": None
            }
        
        # Determine proper status display
        status_display = get_application_status_display(app)
        app_dict["status_display"] = status_display
        
        print(f"  Final app_dict keys: {list(app_dict.keys())}")
        print(f"  Job in app_dict: {app_dict.get('job')}")
        print(f"  Company in app_dict: {app_dict.get('company')}")
        
        enhanced_applications.append(app_dict)
    
    print(f"\n=== Returning {len(enhanced_applications)} applications ===")
    return enhanced_applications


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
    
    # Return properly formatted response
    base_data = {
        "id": application.id,
        "job_id": application.job_id,
        "candidate_id": application.candidate_id,
        "user_id": application.user_id,
        "status": application.status,
        "resume_match_score": application.resume_match_score,
        "resume_analysis": application.resume_analysis,
        "assessment_score": application.assessment_score,
        "interview_score": application.interview_score,
        "final_score": application.final_score,
        "hr_notes": application.hr_notes,
        "created_at": application.created_at
    }
    
    return {
        **base_data,
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
    
    # Convert applications to proper format
    formatted_applications = []
    for app in applications:
        app_dict = {
            "id": app.id,
            "job_id": app.job_id,
            "candidate_id": app.candidate_id,
            "user_id": app.user_id,
            "status": app.status,
            "resume_match_score": app.resume_match_score,
            "resume_analysis": app.resume_analysis,
            "assessment_score": app.assessment_score,
            "interview_score": app.interview_score,
            "final_score": app.final_score,
            "hr_notes": app.hr_notes,
            "created_at": app.created_at
        }
        formatted_applications.append(app_dict)
    
    return formatted_applications


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
    
    # Return properly formatted response
    base_data = {
        "id": application.id,
        "job_id": application.job_id,
        "candidate_id": application.candidate_id,
        "user_id": application.user_id,
        "status": application.status,
        "resume_match_score": application.resume_match_score,
        "resume_analysis": application.resume_analysis,
        "assessment_score": application.assessment_score,
        "interview_score": application.interview_score,
        "final_score": application.final_score,
        "hr_notes": application.hr_notes,
        "created_at": application.created_at
    }
    
    return {
        **base_data,
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
    
    # Return properly formatted response
    response_data = {
        "id": application.id,
        "job_id": application.job_id,
        "candidate_id": application.candidate_id,
        "user_id": application.user_id,
        "status": application.status,
        "resume_match_score": application.resume_match_score,
        "resume_analysis": application.resume_analysis,
        "assessment_score": application.assessment_score,
        "interview_score": application.interview_score,
        "final_score": application.final_score,
        "hr_notes": application.hr_notes,
        "created_at": application.created_at
    }
    
    return response_data


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
