from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Union

from .database import get_db
from .models import Employer, Candidate
from .schemas import UserCreate, LoginRequest, Token, EmployerOut, CandidateOut
from .utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()


@router.post("/register", response_model=Union[EmployerOut, CandidateOut])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user as either an employer or candidate based on is_employer flag.
    If is_employer is True, entry goes to employers table.
    If is_employer is False, entry goes to candidates table.
    """
    
    if user_in.is_employer:
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
            name=user_in.name,
            email=user_in.email,
            hashed_password=hashed_password
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
            name=user_in.name,
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
    Login a user based on their role (employer or candidate).
    The is_employer flag determines which table to search in.
    """
    
    if user_in.is_employer:
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
    
    access_token = create_access_token(user_id=user.id, is_employer=user_in.is_employer)
    
    return {"access_token": access_token, "token_type": "bearer"}
