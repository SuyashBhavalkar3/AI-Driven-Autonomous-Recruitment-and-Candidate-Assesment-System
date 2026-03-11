from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, APIRouter, Form
from sqlalchemy.orm import Session
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
import io
from authentication.database import get_db
from resume_parsing.models import Candidate
from candidate_profile.models import Experience, Education, Skill, Project
from resume_parsing.schemas import ResumeResponse
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.utils import parse_resume
from middleware.rate_limiter import rate_limiter

load_dotenv()

router = APIRouter(prefix="/v1/resume", tags=["Resume Parsing"], dependencies=[Depends(rate_limiter)])

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    phone: str = Form(...),
    linkedin_url: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload resume and parse it with AI"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot upload resumes")
    
    # Check if candidate already has a profile
    existing = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resume already uploaded. Use update endpoint to modify.")
    
    # Validate file type
    if file.content_type not in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and Word documents are allowed.")
    
    # Upload to Cloudinary
    try:
        file_bytes = await file.read()

        data = parse_resume(
            io.BytesIO(file_bytes),
            file.filename
        )

        upload_result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="raw",
            public_id=f"resumes/{current_user.id}_{file.filename}"
        )
        file_url = upload_result["secure_url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # Save to database
    resume = Candidate(
        user_id=current_user.id,
        phone=phone,
        linkedin_url=linkedin_url,
        resume_url=file_url,
        parsed_data=data
    )
    
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Save parsed data to separate tables
    try:
        # Save experiences
        if data.get("experience"):
            for exp in data["experience"]:
                if exp.get("company_name") and exp.get("job_title"):
                    experience = Experience(
                        candidate_id=resume.id,
                        company_name=exp.get("company_name", ""),
                        job_title=exp.get("job_title", ""),
                        location=exp.get("location"),
                        start_date=exp.get("start_date", ""),
                        end_date=exp.get("end_date"),
                        is_current=exp.get("is_current", False),
                        description=exp.get("description")
                    )
                    db.add(experience)
        
        # Save education
        if data.get("education"):
            for edu in data["education"]:
                if edu.get("institution") and edu.get("degree"):
                    education = Education(
                        candidate_id=resume.id,
                        institution=edu.get("institution", ""),
                        degree=edu.get("degree", ""),
                        field_of_study=edu.get("field_of_study"),
                        start_date=edu.get("start_date", ""),
                        end_date=edu.get("end_date"),
                        grade=edu.get("grade")
                    )
                    db.add(education)
        
        # Save skills
        if data.get("skills"):
            for skill in data["skills"]:
                if skill.get("skill_name"):
                    skill_obj = Skill(
                        candidate_id=resume.id,
                        skill_name=skill.get("skill_name", ""),
                        proficiency=skill.get("proficiency")
                    )
                    db.add(skill_obj)
        
        # Save projects
        if data.get("projects"):
            for proj in data["projects"]:
                if proj.get("project_name"):
                    project = Project(
                        candidate_id=resume.id,
                        project_name=proj.get("project_name", ""),
                        description=proj.get("description"),
                        github_url=proj.get("github_url")
                    )
                    db.add(project)
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save parsed data: {str(e)}")

    return resume