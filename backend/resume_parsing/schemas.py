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