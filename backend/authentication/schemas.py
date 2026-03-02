from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    is_employer: bool  # True for employer, False for candidate (from checkbox)
    company: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    is_employer: Optional[bool] = None  # Optional - will fetch from user record if not provided


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    is_employer: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_employer: bool
    company: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
