from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class ResumeCreate(BaseModel):
    user_id: int
    phone: str = Field(..., min_length=10, max_length=20)
    linkedin_url: str = Field(..., min_length=10)

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    phone: str
    linkedin_url: str
    resume_url: str
    parsed_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: str
    linkedin_url: str
    resume_url: str
    parsed_data: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

class CandidateProfileUpdate(BaseModel):
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    linkedin_url: Optional[str] = Field(None, min_length=10)

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ResumeCreate(BaseModel):
    user_id: int
    phone: str
    linkedin_url: str
    #resume_url: str

class EducationSchema(BaseModel):
    id: int
    institution: Optional[str]
    degree: Optional[str]
    field_of_study: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    grade: Optional[str]
    marks: Optional[str]
    location: Optional[str]

    class Config:
        from_attributes = True


class ExperienceSchema(BaseModel):
    id: int
    company_name: Optional[str]
    job_title: Optional[str]
    location: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    is_current: Optional[bool]
    description: Optional[str]
    # responsibilities: Optional[str]

    class Config:
        from_attributes = True


class ProjectSchema(BaseModel):
    id: int
    project_name: Optional[str]
    description: Optional[str]
    github_url: Optional[str]

    class Config:
        from_attributes = True


class SkillSchema(BaseModel):
    id: int
    languages: Optional[str]
    backend_technologies: Optional[str]
    databases: Optional[str]
    ai_ml_frameworks: Optional[str]
    tools_platforms: Optional[str]
    core_competencies: Optional[str]

    class Config:
        from_attributes = True


class CertificationSchema(BaseModel):
    id: int
    title: Optional[str]

    class Config:
        from_attributes = True


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    linkedin_url: Optional[str]
    resume_url: Optional[str]
    created_at: datetime
    education: List[EducationSchema] = []
    experiences: List[ExperienceSchema] = []
    projects: List[ProjectSchema] = []
    skills: List[SkillSchema] = []
    certifications: List[CertificationSchema] = []

    class Config:
        from_attributes = True