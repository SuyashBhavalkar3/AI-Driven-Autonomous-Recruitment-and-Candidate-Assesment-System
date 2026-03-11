from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from assessment.models import Assessment, AssessmentQuestion, AssessmentAnswer
from assessment.schemas import (
    AssessmentStartResponse,
    AssessmentQuestionResponse,
    SubmitAssessmentRequest,
    AssessmentResultResponse,
    AssessmentFeedbackResponse,
    AssessmentAnswerDetail
)
from assessment.assessment_service import evaluate_assessment_answers
from middleware.rate_limiter import rate_limiter
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/assessment", tags=["Assessment"], dependencies=[Depends(rate_limiter)])


@router.get("/start/{application_id}", response_model=AssessmentStartResponse)
async def start_assessment(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start assessment for a candidate.
    
    Returns pre-generated questions WITHOUT correct answers.
    If assessment doesn't exist, returns 404.
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot take assessments")
    
    # Verify application belongs to current user
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Assessment should exist by this point (created during application)
    assessment = db.query(Assessment).filter(
        Assessment.application_id == application_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=400,
            detail="Assessment not yet generated. Your resume did not meet the minimum threshold."
        )
    
    if assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment already completed")
    
    # Update started_at if not already started
    if not assessment.started_at:
        assessment.started_at = datetime.utcnow()
        db.commit()
    
    # Fetch questions without correct answers
    questions_from_db = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment.id
    ).all()
    
    # Convert to response schema (without correct_option)
    questions_response = [
        AssessmentQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            topic=q.topic,
            difficulty=q.difficulty
        )
        for q in questions_from_db
    ]
    
    return AssessmentStartResponse(
        id=assessment.id,
        application_id=assessment.application_id,
        questions=questions_response,
        started_at=assessment.started_at,
        completed=assessment.completed
    )


@router.post("/submit/{application_id}", response_model=AssessmentResultResponse)
async def submit_assessment(
    application_id: int,
    submission: SubmitAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit assessment answers and calculate score.
    
    Workflow:
    1. Validate application and assessment
    2. Store answers
    3. Evaluate against correct answers
    4. Update assessment with score
    5. Update application status
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot submit assessments")
    
    # Verify application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get assessment
    assessment = db.query(Assessment).filter(
        Assessment.application_id == application_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=400, detail="Assessment not found")
    
    if assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment already submitted")
    
    # Store answers and calculate score
    total_questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment.id
    ).count()
    
    correct_count = 0
    
    for answer_data in submission.answers:
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.id == answer_data.question_id,
            AssessmentQuestion.assessment_id == assessment.id
        ).first()
        
        if not question:
            raise HTTPException(status_code=400, detail=f"Question {answer_data.question_id} not found in this assessment")
        
        # Check if answer is correct
        is_correct = answer_data.selected_option == question.correct_option
        if is_correct:
            correct_count += 1
        
        # Store the answer
        answer_record = AssessmentAnswer(
            assessment_id=assessment.id,
            question_id=answer_data.question_id,
            selected_option=answer_data.selected_option,
            is_correct=is_correct
        )
        db.add(answer_record)
    
    # Calculate score (e.g., 10 points per correct answer for 10 questions)
    points_per_question = 100 / total_questions if total_questions > 0 else 0
    score = int(correct_count * points_per_question)
    percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    # Update assessment
    assessment.score = score
    assessment.completed = True
    assessment.completed_at = datetime.utcnow()
    
    # Update application
    application.assessment_score = score
    application.status = ApplicationStatus.ASSESSMENT_COMPLETED
    
    db.commit()
    db.refresh(assessment)
    
    logger.info(f"Assessment {assessment.id} submitted. Score: {score}/{100}, Percentage: {percentage:.2f}%")
    
    return AssessmentResultResponse(
        id=assessment.id,
        application_id=assessment.application_id,
        score=score,
        total_questions=total_questions,
        percentage=round(percentage, 2),
        questions_answered=len(submission.answers),
        correct_answers=correct_count,
        completed_at=assessment.completed_at
    )


@router.get("/result/{application_id}", response_model=AssessmentFeedbackResponse)
async def get_assessment_result(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed assessment results and feedback.
    
    Returns score, percentage, correctness of each answer, and overall pass/fail.
    Only available after assessment is completed.
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot access this endpoint")
    
    # Verify application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get assessment
    assessment = db.query(Assessment).filter(
        Assessment.application_id == application_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=400, detail="Assessment not found")
    
    if not assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment not yet completed")
    
    # Get all answers with their questions
    answers = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.assessment_id == assessment.id
    ).all()
    
    answer_details = []
    for answer in answers:
        question = answer.question
        answer_details.append(
            AssessmentAnswerDetail(
                question_id=answer.question_id,
                question_text=question.question_text,
                selected_option=answer.selected_option,
                correct_option=question.correct_option,
                is_correct=answer.is_correct
            )
        )
    
    # Calculate metrics
    total_questions = len(answer_details)
    correct_count = sum(1 for a in answer_details if a.is_correct)
    percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    passed = percentage >= 60  # 60% threshold
    
    return AssessmentFeedbackResponse(
        score=assessment.score or 0,
        total_questions=total_questions,
        percentage=round(percentage, 2),
        passed=passed,
        answers=answer_details
    )

