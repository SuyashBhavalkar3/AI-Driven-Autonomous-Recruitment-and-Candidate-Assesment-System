from pydantic import BaseModel
from datetime import datetime

class ResumeCreate(BaseModel):
    user_id: int
    phone: str
    linkedin_url: str
    #resume_url: str

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    phone: str
    linkedin_url: str
    resume_url: str
    parsed_data: dict
    created_at: datetime

    class Config:
        from_attributes = True