# schemas.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    HR = "hr"

# Base User
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole

class UserCreate(BaseModel):
    fullName: str                     # matches frontend
    email: EmailStr
    password: str
    role: UserRole                     # still needed to know which profile to create
    company: Optional[str] = None  
    password: str
    company_name: Optional[str] = None  # Required if role=hr
    @validator('company_name')
    def validate_company(cls, v, values):
        if values.get('role') == UserRole.HR and not v:
            raise ValueError('Company name is required for HR')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
 

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    candidate_profile: Optional['CandidateProfileOut'] = None
    hr_profile: Optional['HRProfileOut'] = None

    class Config:
        from_attributes = True

# Candidate Profile
class CandidateProfileBase(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class CandidateProfileCreate(CandidateProfileBase):
    pass

class CandidateProfileOut(CandidateProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# HR Profile
class HRProfileBase(BaseModel):
    company_name: str
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    position: Optional[str] = None

class HRProfileCreate(HRProfileBase):
    pass

class HRProfileOut(HRProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Jobs
class JobBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    employment_type: Optional[str] = None
    experience_required: Optional[int] = None
    expires_at: Optional[datetime] = None

class JobCreate(JobBase):
    pass

class JobOut(JobBase):
    id: int
    hr_id: int
    is_active: bool
    posted_at: datetime
    applications_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Applications
class ApplicationBase(BaseModel):
    cover_letter: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    job_id: int

class ApplicationOut(ApplicationBase):
    id: int
    job_id: int
    candidate_id: int
    status: str
    applied_at: datetime
    job: Optional[JobOut] = None
    candidate: Optional[UserOut] = None

    class Config:
        from_attributes = True

# Token
# schemas.py

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut  # add this field

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None