from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ExperienceCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    job_title: str = Field(..., min_length=2, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    start_date: str = Field(..., min_length=4)
    end_date: Optional[str] = Field(None, min_length=4)
    is_current: bool = False
    description: Optional[str] = None

class ExperienceResponse(ExperienceCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class EducationCreate(BaseModel):
    institution: str = Field(..., min_length=2, max_length=200)
    degree: str = Field(..., min_length=2, max_length=200)
    field_of_study: Optional[str] = Field(None, max_length=200)
    start_date: str = Field(..., min_length=4)
    end_date: Optional[str] = Field(None, min_length=4)
    grade: Optional[str] = Field(None, max_length=50)

class EducationResponse(EducationCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SkillCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=100)
    proficiency: Optional[str] = Field(None, max_length=50)

class SkillResponse(SkillCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CandidateProfileComplete(BaseModel):
    experiences: List[ExperienceCreate]
    education: List[EducationCreate]
    skills: List[SkillCreate]
