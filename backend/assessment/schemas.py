from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class QuestionSchema(BaseModel):
    id: int
    type: str  # coding, mcq, text
    title: str
    description: str
    points: int
    options: Optional[List[str]] = None
    starter_code: Optional[str] = None

class AssessmentResponse(BaseModel):
    id: int
    application_id: int
    questions: List[dict]
    completed: bool
    score: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SubmitAssessmentRequest(BaseModel):
    answers: dict  # question_id -> answer mapping
