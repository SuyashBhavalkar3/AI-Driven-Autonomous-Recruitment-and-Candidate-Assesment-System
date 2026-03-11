from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from resume_parsing.schemas import CandidateProfileResponse, CandidateProfileUpdate
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/profile", tags=["Profile"], dependencies=[Depends(rate_limiter)])


@router.get("/candidate", response_model=CandidateProfileResponse)
def get_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get candidate profile"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot access candidate profiles")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found. Please upload your resume first.")
    
    return candidate


@router.put("/candidate", response_model=CandidateProfileResponse)
def update_candidate_profile(
    profile_update: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update candidate profile"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot update candidate profiles")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found. Please upload your resume first.")
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(candidate, key, value)
    
    db.commit()
    db.refresh(candidate)
    
    return candidate


@router.get("/hr")
def get_hr_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get HR profile"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "company": current_user.company_name,
        "created_at": current_user.created_at
    }


@router.put("/hr")
def update_hr_profile(
    name: str = None,
    company: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update HR profile"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can update HR profiles")
    
    if name:
        current_user.name = name
    if company:
        current_user.company = company
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "company": current_user.company,
        "created_at": current_user.created_at
    }
