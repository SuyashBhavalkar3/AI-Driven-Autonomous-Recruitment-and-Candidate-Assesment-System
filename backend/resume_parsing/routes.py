# 

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, APIRouter, Form
from sqlalchemy.orm import Session
import cloudinary, cloudinary.uploader
import os, io
from dotenv import load_dotenv

load_dotenv(override=True)

from authentication.database import get_db
from resume_parsing.models import Candidate
from resume_parsing.schemas import ResumeResponse
from authentication.utils import get_current_user
from resume_parsing.utils import parse_resume
from resume_parsing.utils import save_parsed_data

router = APIRouter(prefix="/resume", tags=["Resume Parsing"])

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

print(f"[DEBUG] Cloudinary config - cloud_name: {os.getenv('CLOUD_NAME')}, api_key: {os.getenv('CLOUDINARY_API_KEY')[:10] if os.getenv('CLOUDINARY_API_KEY') else 'NOT FOUND'}")

@router.post("/upload-resume/", response_model=ResumeResponse)
async def upload_resume(
    user_id: int = Form(...),
    phone: str = Form(...),
    linkedin_url: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if file.content_type not in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are allowed.")

    try:
        file_bytes = await file.read()
        print(f"[DEBUG] File read, size: {len(file_bytes)}")

        # Parse resume text → structured JSON via LLM
        parsed_data = parse_resume(io.BytesIO(file_bytes), file.filename)
        print(f"[DEBUG] Parsed data received")

        # Upload file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_bytes, resource_type="raw", public_id=file.filename
        )
        file_url = upload_result["secure_url"]
        print(f"[DEBUG] File uploaded to Cloudinary: {file_url}")

    except Exception as e:
        print(f"[ERROR] Processing failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    # Save candidate base record
    try:
        candidate = Candidate(
            user_id=user_id,
            phone=phone,
            linkedin_url=linkedin_url,
            resume_url=file_url,
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        print(f"[DEBUG] Candidate saved with ID: {candidate.id}")

        # Save parsed sections into separate tables
        if isinstance(parsed_data, dict) and "error" not in parsed_data:
            save_parsed_data(db, candidate.id, parsed_data)
            db.refresh(candidate)

        return candidate
    except Exception as e:
        print(f"[ERROR] Database save failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")
