from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    role: str  # "hr" or "candidate"
    company: Optional[str] = None  # Required for HR


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "hr" or "candidate"


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    is_employer: Optional[bool] = None


class EmployerOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True
