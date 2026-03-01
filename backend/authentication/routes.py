from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Union

from .database import get_db
from .models import Employer, Candidate
from .schemas import UserCreate, LoginRequest, Token, EmployerOut, CandidateOut
from .utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter()


@router.post("/register", response_model=Union[EmployerOut, CandidateOut])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user as either an employer or candidate based on role.
    If role is "hr", entry goes to employers table.
    If role is "candidate", entry goes to candidates table.
    """
    
    if user_in.role == "hr":
        # Check if email already exists in employers table
        existing_user = db.query(Employer).filter(Employer.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered as employer"
            )
        
        # Hash password & create employer
        hashed_password = get_password_hash(user_in.password)
        user = Employer(
            name=user_in.fullName,
            email=user_in.email,
            hashed_password=hashed_password,
            company=user_in.company
        )
    else:
        # Check if email already exists in candidates table
        existing_user = db.query(Candidate).filter(Candidate.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered as candidate"
            )
        
        # Hash password & create candidate
        hashed_password = get_password_hash(user_in.password)
        user = Candidate(
            name=user_in.fullName,
            email=user_in.email,
            hashed_password=hashed_password
        )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login(user_in: LoginRequest, db: Session = Depends(get_db)):
    """
    Login a user based on their role (hr or candidate).
    The role determines which table to search in.
    """
    
    if user_in.role == "hr":
        # Search in employers table
        user = db.query(Employer).filter(Employer.email == user_in.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
    else:
        # Search in candidates table
        user = db.query(Candidate).filter(Candidate.email == user_in.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(user_id=user.id, is_employer=(user_in.role == "hr"))
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=Union[EmployerOut, CandidateOut])
def get_me(current_user: Union[Employer, Candidate] = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    return current_user
