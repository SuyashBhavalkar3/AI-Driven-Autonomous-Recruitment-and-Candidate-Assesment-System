from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class MCQQuestionResponse(BaseModel):
    """MCQ question response WITHOUT correct answer"""
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    marks: int = 4
    
    class Config:
        from_attributes = True


class DSAQuestionResponse(BaseModel):
    """DSA coding question response"""
    id: int
    question_text: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    example_input: Optional[str] = None
    example_output: Optional[str] = None
    expected_time_complexity: Optional[str] = None
    expected_space_complexity: Optional[str] = None
    constraints: Optional[str] = None
    marks: int = 30
    
    class Config:
        from_attributes = True


class AssessmentStartResponse(BaseModel):
    """Response when candidate starts assessment"""
    id: int
    application_id: int
    mcq_questions: List[MCQQuestionResponse]
    dsa_questions: List[DSAQuestionResponse]
    started_at: Optional[datetime] = None
    completed: bool
    
    class Config:
        from_attributes = True


class MCQAnswerSubmission(BaseModel):
    """Single MCQ answer submission"""
    question_id: int
    selected_option: str  # A, B, C, or D


class DSACodeSubmission(BaseModel):
    """Single DSA code submission"""
    question_id: int
    code: str
    language: str = "python3"  # python3, java, cpp17, etc.


class SubmitAssessmentRequest(BaseModel):
    """Submit both MCQ answers and DSA code"""
    mcq_answers: List[MCQAnswerSubmission]
    dsa_submissions: List[DSACodeSubmission]


class AssessmentResultResponse(BaseModel):
    """Assessment result with score breakdown"""
    id: int
    application_id: int
    mcq_score: int  # Out of 40
    dsa_score: int  # Out of 60
    total_score: int  # Out of 100
    mcq_correct: int
    total_mcq: int
    dsa_test_cases_passed: int
    total_dsa_test_cases: int
    qualifies_for_interview: bool = False
    next_status: Optional[str] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MCQAnswerDetail(BaseModel):
    """Detailed MCQ answer with correctness"""
    question_id: int
    question_text: str
    selected_option: Optional[str]
    correct_option: str
    is_correct: Optional[bool]
    marks_obtained: int
    
    class Config:
        from_attributes = True


class DSASubmissionDetail(BaseModel):
    """Detailed DSA submission with results"""
    question_id: int
    question_text: str
    code: str
    language: str
    test_cases_passed: int
    total_test_cases: int
    marks_obtained: int
    execution_feedback: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class AssessmentFeedbackResponse(BaseModel):
    """Detailed feedback after assessment completion"""
    mcq_score: int
    dsa_score: int
    total_score: int
    passed: bool
    mcq_answers: List[MCQAnswerDetail]
    dsa_submissions: List[DSASubmissionDetail]
    
    class Config:
        from_attributes = True
