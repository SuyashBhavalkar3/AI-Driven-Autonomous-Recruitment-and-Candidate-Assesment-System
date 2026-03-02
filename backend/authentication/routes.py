# auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Union

from .database import get_db
from .models import User, CandidateProfile, HRProfile,UserRole
from .schemas import UserCreate, UserLogin, Token, UserOut, CandidateProfileCreate, HRProfileCreate
from .utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        full_name=user_in.fullName,          # map fullName -> full_name
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(user)
    db.flush()  # get user.id

    # Create profile based on role
    if user_in.role == UserRole.HR:
        if not user_in.company:
            raise HTTPException(status_code=400, detail="Company name required for HR")
        profile = HRProfile(
            user_id=user.id,
            company_name=user_in.company      # map company -> company_name
        )
    else:
        profile = CandidateProfile(user_id=user.id)

    db.add(profile)
    db.commit()
    db.refresh(user)
    return user
# auth.py (updated login)

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    # Find user by email only
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.id, user.role.value)
    # Return token + user object
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user