from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Union

from .database import get_db
from .models import User
from .schemas import UserCreate, LoginRequest, Token, UserOut
from .utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()


@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user as either an employer or candidate based on is_employer flag.
    """
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password & create user
    hashed_password = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_password,
        is_employer=user_in.is_employer
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login(user_in: LoginRequest, db: Session = Depends(get_db)):
    """
    Login a user based on their email and verify the is_employer flag matches.
    """
    
    # Search for user by email
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify the is_employer flag matches
    if user.is_employer != user_in.is_employer:
        raise HTTPException(status_code=401, detail="Invalid role for this email")
    
    access_token = create_access_token(user_id=user.id, is_employer=user.is_employer)
    
    return {"access_token": access_token, "token_type": "bearer"}
