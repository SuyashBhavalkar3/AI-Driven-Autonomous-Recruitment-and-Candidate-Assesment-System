from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from resume_analysis.ai_service import analyze_resume_with_ai
from typing import Dict, Any, List, Optional
from datetime import datetime

router = APIRouter(prefix="/resume-analysis", tags=["Resume Analysis"])

def extract_complete_candidate_data(candidate: Candidate) -> Dict[str, Any]:
    """Extract ALL available data from candidate with perfect completeness"""
    
    # Always fetch fresh relationships
    education_data = []
    for edu in candidate.education:
        edu_item = {
            "id": edu.id,
            "institution": edu.institution or "",
            "degree": edu.degree or "",
            "field_of_study": edu.field_of_study or "",
            "start_date": edu.start_date or "",
            "end_date": edu.end_date or "",
            "grade": edu.grade or "",
            "graduation_date": edu.graduation_date or "",
            "marks": edu.marks or "",
            "location": edu.location or "",
            "created_at": str(edu.created_at) if edu.created_at else ""
        }
        education_data.append(edu_item)
    
    # Extract ALL experience data
    experience_data = []
    for exp in candidate.experiences:
        exp_item = {
            "id": exp.id,
            "company_name": exp.company_name or "",
            "job_title": exp.job_title or "",
            "location": exp.location or "",
            "start_date": exp.start_date or "",
            "end_date": exp.end_date or "Present" if exp.is_current else exp.end_date or "",
            "is_current": exp.is_current or False,
            "description": exp.description or "",
            "marks": exp.marks or "",
            "created_at": str(exp.created_at) if exp.created_at else ""
        }
        experience_data.append(exp_item)
    
    # Extract ALL skills data with perfect granularity
    skills_data = []
    for skill in candidate.skills:
        skill_item = {
            "id": skill.id,
            "languages": skill.languages or "",
            "backend_technologies": skill.backend_technologies or "",
            "databases": skill.databases or "",
            "ai_ml_frameworks": skill.ai_ml_frameworks or "",
            "tools_platforms": skill.tools_platforms or "",
            "core_competencies": skill.core_competencies or "",
            "created_at": str(skill.created_at) if skill.created_at else ""
        }
        skills_data.append(skill_item)
    
    # Extract ALL project data
    projects_data = []
    for project in candidate.projects:
        project_item = {
            "id": project.id,
            "project_name": project.project_name or "",
            "description": project.description or "",
            "github_url": project.github_url or "",
            "created_at": str(project.created_at) if project.created_at else ""
        }
        projects_data.append(project_item)
    
    # Extract ALL certification data
    certifications_data = []
    for cert in candidate.certifications:
        cert_item = {
            "id": cert.id,
            "title": cert.title or "",
            "created_at": str(cert.created_at) if cert.created_at else ""
        }
        certifications_data.append(cert_item)
    
    # Extract ALL candidate profile data
    candidate_profile = {
        "id": candidate.id,
        "user_id": candidate.user_id,
        "phone": candidate.phone or "",
        "linkedin_url": candidate.linkedin_url or "",
        "resume_url": candidate.resume_url or "",
        "profile_photo_url": candidate.profile_photo_url or "",
        "bio": candidate.bio or "",
        "location": candidate.location or "",
        "profile_completed": candidate.profile_completed or False,
        "created_at": str(candidate.created_at) if candidate.created_at else "",
        "parsed_data": candidate.parsed_data or {}
    }
    
    return {
        "candidate_profile": candidate_profile,
        "education": education_data,
        "experiences": experience_data,
        "skills": skills_data,
        "projects": projects_data,
        "certifications": certifications_data,
        "total_records": {
            "education_count": len(education_data),
            "experience_count": len(experience_data),
            "skills_count": len(skills_data),
            "projects_count": len(projects_data),
            "certifications_count": len(certifications_data)
        }
    }

@router.get("/test-auth")
async def test_authentication(
    current_user: User = Depends(get_current_user)
):
    """Test endpoint to verify authentication is working"""
    return {
        "status": "success",
        "message": "Authentication working",
        "user_id": current_user.id,
        "email": current_user.email
    }

@router.get("/analyze")
async def analyze_current_user_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Always fetch FRESH resume data and analyze with perfect extraction"""
    
    # Always get the most recent candidate record with ALL relationships
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .order_by(desc(Candidate.created_at))  # Get most recent
        .first()
    )
    
    if not candidate:
        raise HTTPException(
            status_code=404, 
            detail="No resume found. Please upload your resume first."
        )
    
    # Force refresh all relationships to get latest data
    db.refresh(candidate)
    
    # Extract COMPLETE data with perfect granularity
    complete_data = extract_complete_candidate_data(candidate)
    
    # Analyze with AI using the complete extracted data
    try:
        analysis = analyze_resume_with_ai(complete_data)
        
        return {
            "status": "success",
            "message": "Fresh resume data analyzed successfully",
            "data": analysis,
            "metadata": {
                "candidate_id": candidate.id,
                "user_id": candidate.user_id,
                "last_updated": str(candidate.created_at),
                "data_completeness": complete_data["total_records"],
                "extraction_timestamp": datetime.now().isoformat()
            },
            "raw_extracted_data": complete_data  # Include raw data for transparency
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/analyze/{candidate_id}")
async def analyze_specific_resume(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze specific candidate with fresh data extraction"""
    
    # Get specific candidate with ALL relationships
    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Force refresh to get latest data
    db.refresh(candidate)
    
    # Extract complete data
    complete_data = extract_complete_candidate_data(candidate)
    
    # Analyze with AI
    try:
        analysis = analyze_resume_with_ai(complete_data)
        
        return {
            "status": "success",
            "message": f"Fresh analysis completed for candidate {candidate_id}",
            "data": analysis,
            "metadata": {
                "candidate_id": candidate.id,
                "user_id": candidate.user_id,
                "last_updated": str(candidate.created_at),
                "data_completeness": complete_data["total_records"],
                "extraction_timestamp": datetime.now().isoformat()
            },
            "raw_extracted_data": complete_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/raw-data")
async def get_raw_candidate_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get raw extracted data without analysis for debugging"""
    
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .order_by(desc(Candidate.created_at))
        .first()
    )
    
    if not candidate:
        raise HTTPException(status_code=404, detail="No resume found")
    
    db.refresh(candidate)
    complete_data = extract_complete_candidate_data(candidate)
    
    return {
        "status": "success",
        "message": "Raw data extracted successfully",
        "data": complete_data,
        "extraction_timestamp": datetime.now().isoformat()
    }