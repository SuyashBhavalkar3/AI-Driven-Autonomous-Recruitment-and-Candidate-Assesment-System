from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, APIRouter, Form
from sqlalchemy.orm import Session
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
import io
from authentication.database import SessionLocal, engine, get_db
from resume_parsing.models import Candidate
from resume_parsing.schemas import ResumeCreate, ResumeResponse
from authentication.utils import get_current_user
from resume_parsing.utils import parse_resume

load_dotenv()

router = APIRouter(prefix="/resume", tags=["Resume Parsing"])

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)

@router.post("/upload-resume/", response_model=ResumeResponse)
async def upload_resume(user_id: int = Form(...),
    phone: str = Form(...),
    linkedin_url: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    """
    Upload a resume file, store it in Cloudinary, and save the metadata in the database.
    """
    # Validate file type
    print(file)
    if file.content_type not in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and Word documents are allowed.")
    
    # Upload to Cloudinary
    try:
        file_bytes = await file.read()

        data = parse_resume(
            io.BytesIO(file_bytes),  # file stream
            file.filename            # filename string
        )

        upload_result = cloudinary.uploader.upload(
        file_bytes,
        resource_type="raw",
        public_id=file.filename
        )
        file_url = upload_result["secure_url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # Save metadata to database
    resume = Candidate(
        user_id=user_id,
        phone=phone,
        linkedin_url=linkedin_url,
        resume_url=file_url,
        parsed_data=data  # This will be filled after parsing
    )
    
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        phone=resume.phone,
        linkedin_url=resume.linkedin_url,
        resume_url=resume.resume_url,
        parsed_data=resume.parsed_data,
        created_at=resume.created_at
    )