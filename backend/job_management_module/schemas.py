from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    required_skills: List[str] = Field(..., min_items=1)
    experience_required: int = Field(..., ge=0, le=50)
    location: str = Field(..., min_length=2, max_length=200)
    salary_range: str = Field(..., min_length=3, max_length=100)

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    required_skills: Optional[List[str]] = Field(None, min_items=1)
    experience_required: Optional[int] = Field(None, ge=0, le=50)
    location: Optional[str] = Field(None, min_length=2, max_length=200)
    salary_range: Optional[str] = Field(None, min_length=3, max_length=100)

class JobResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    required_skills: List[str]
    experience_required: int
    location: str
    salary_range: str
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class JobWithCompanyResponse(JobResponse):
    company_name: Optional[str]
    company_website: Optional[str]