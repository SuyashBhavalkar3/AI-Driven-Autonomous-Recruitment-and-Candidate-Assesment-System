from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AssessmentQuestionResponse(BaseModel):
    """Question response WITHOUT correct answer (for candidates taking the test)"""
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    
    class Config:
        from_attributes = True


class AssessmentQuestionWithAnswer(BaseModel):
    """Question response WITH correct answer (for grading/admin)"""
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    explanation: Optional[str] = None
    
    class Config:
        from_attributes = True


class AssessmentStartResponse(BaseModel):
    """Response when candidate starts assessment"""
    id: int
    application_id: int
    questions: List[AssessmentQuestionResponse]
    started_at: Optional[datetime] = None
    completed: bool
    
    class Config:
        from_attributes = True


class AnswerSubmission(BaseModel):
    """Single answer submission"""
    question_id: int
    selected_option: str  # A, B, C, or D


class SubmitAssessmentRequest(BaseModel):
    """Submit multiple answers"""
    answers: List[AnswerSubmission]


class AssessmentResultResponse(BaseModel):
    """Assessment result with score and feedback"""
    id: int
    application_id: int
    score: int
    total_questions: int
    percentage: float
    questions_answered: int
    correct_answers: int
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AssessmentAnswerDetail(BaseModel):
    """Detailed answer with correctness"""
    question_id: int
    question_text: str
    selected_option: Optional[str]
    correct_option: str
    is_correct: Optional[bool]
    
    class Config:
        from_attributes = True


class AssessmentFeedbackResponse(BaseModel):
    """Detailed feedback after assessment completion"""
    score: int
    total_questions: int
    percentage: float
    passed: bool  # True if percentage >= 60 or configurable threshold
    answers: List[AssessmentAnswerDetail]
    
    class Config:
        from_attributes = True
