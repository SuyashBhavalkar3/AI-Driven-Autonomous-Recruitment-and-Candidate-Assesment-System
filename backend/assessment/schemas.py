from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class QuestionSchema(BaseModel):
    id: int
    type: str  # coding, mcq
    title: str
    description: str
    points: int
    options: Optional[List[str]] = None
    starter_code: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None

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
    answers: Dict[str, Any]  # question_id -> answer mapping

class AssessmentResultResponse(BaseModel):
    message: str
    score: int
    passed: bool
    total_points: int
    earned_points: int
    next_step: str
    detailed_results: List[Dict[str, Any]]

class InterviewEligibilityResponse(BaseModel):
    eligible: bool
    reason: str
    assessment_score: Optional[int]
    required_score: int
    status: str
    can_schedule_interview: bool
