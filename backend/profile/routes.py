from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from candidate_profile.schemas import CandidateProfileComplete
from candidate_profile.models import Experience, Education, Skill, Project
from resume_parsing.utils import parse_resume
import io

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.post("/parse")
async def parse_resume_for_profile(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    if file.content_type not in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are allowed")
    
    try:
        file_bytes = await file.read()
        parsed_data = parse_resume(io.BytesIO(file_bytes), file.filename)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

@router.get("/status")
def get_profile_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    
    if not candidate:
        return {"profile_completed": False}
    
    return {"profile_completed": candidate.profile_completed}

@router.post("/save")
def save_profile(
    profile_data: CandidateProfileComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    
    # Create candidate record if it doesn't exist
    if not candidate:
        candidate = Candidate(
            user_id=current_user.id,
            linkedin_url="",
            resume_url=""
        )
        db.add(candidate)
        db.flush()  # Ensure candidate.id is populated before adding related records
    
    # Clear existing data
    db.query(Experience).filter(Experience.candidate_id == candidate.id).delete()
    db.query(Education).filter(Education.candidate_id == candidate.id).delete()
    db.query(Skill).filter(Skill.candidate_id == candidate.id).delete()
    db.query(Project).filter(Project.candidate_id == candidate.id).delete()
    
    # Add new experiences
    for exp_data in profile_data.experiences:
        experience = Experience(candidate_id=candidate.id, **exp_data.dict())
        db.add(experience)
    
    # Add new education
    for edu_data in profile_data.education:
        education = Education(candidate_id=candidate.id, **edu_data.dict())
        db.add(education)
    
    # Add new skills
    for skill_data in profile_data.skills:
        skill = Skill(candidate_id=candidate.id, **skill_data.dict())
        db.add(skill)
    
    # Mark profile as completed
    candidate.profile_completed = True
    current_user.profile_completed = True
    
    db.commit()
    
    return {"message": "Profile saved successfully", "profile_completed": True}