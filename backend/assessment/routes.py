from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from assessment.models import Assessment
from assessment.schemas import AssessmentResponse, SubmitAssessmentRequest
from assessment.ai_service import generate_assessment_questions, evaluate_assessment_answers
from resume_parsing.models import Candidate
from job_management_module.models import Job
from middleware.rate_limiter import rate_limiter
from datetime import datetime

router = APIRouter(prefix="/v1/assessment", tags=["Assessment"], dependencies=[Depends(rate_limiter)])



@router.get("/start/{application_id}", response_model=AssessmentResponse)
async def start_assessment(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start assessment - generates AI-based questions from job description and candidate skills"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot take assessments")
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if candidate passed resume screening (minimum 20% score)
    if not application.resume_match_score or application.resume_match_score < 20:
        raise HTTPException(
            status_code=400, 
            detail="You must pass resume screening (minimum 20% match) before taking assessment"
        )
    
    if application.status not in [ApplicationStatus.ASSESSMENT_SCHEDULED, ApplicationStatus.RESUME_SCREENED]:
        raise HTTPException(status_code=400, detail="Assessment not available for this application")
    
    # Check if assessment already exists
    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    
    if assessment:
        if assessment.completed:
            raise HTTPException(status_code=400, detail="Assessment already completed")
        return assessment
    
    # Get job and candidate data for AI question generation
    job = db.query(Job).filter(Job.id == application.job_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first()
    
    if not job or not candidate:
        raise HTTPException(status_code=404, detail="Job or candidate data not found")
    
    # Prepare data for AI question generation
    job_data = {
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "experience_required": job.experience_required
    }
    
    # Get candidate skills from their profile
    candidate_skills = []
    if candidate.parsed_data:
        candidate_skills = candidate.parsed_data.get("skills", [])
    
    # Generate AI-based questions (10 MCQs + 2 coding questions)
    try:
        questions_data = await generate_assessment_questions(job_data, candidate_skills)
        questions = questions_data["questions"]
    except Exception as e:
        print(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate assessment questions")
    
    # Create new assessment
    assessment = Assessment(
        application_id=application_id,
        questions=questions,
        started_at=datetime.utcnow()
    )
    
    # Update application status
    application.status = ApplicationStatus.ASSESSMENT_SCHEDULED
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Remove correct answers and expected solutions from response
    safe_questions = []
    for q in questions:
        safe_q = q.copy()
        if "correct_answer" in safe_q:
            del safe_q["correct_answer"]
        if "expected_solution" in safe_q:
            del safe_q["expected_solution"]
        safe_questions.append(safe_q)
    
    assessment.questions = safe_questions
    return assessment


@router.post("/submit/{assessment_id}")
async def submit_assessment(
    assessment_id: int,
    submission: SubmitAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit assessment answers - evaluates with AI and checks 70% pass threshold"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot submit assessments")
    
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    application = db.query(Application).filter(
        Application.id == assessment.application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment already submitted")
    
    # Get original questions with correct answers for evaluation
    original_questions = []
    for q in assessment.questions:
        # Restore correct answers and expected solutions for evaluation
        original_q = q.copy()
        # These would be stored separately or retrieved from the original generation
        original_questions.append(original_q)
    
    # Evaluate answers using AI
    try:
        evaluation_result = await evaluate_assessment_answers(original_questions, submission.answers)
    except Exception as e:
        print(f"Error evaluating assessment: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate assessment")
    
    score = evaluation_result["percentage_score"]
    passed = evaluation_result["passed"]  # True if score >= 70%
    
    # Update assessment
    assessment.answers = submission.answers
    assessment.score = score
    assessment.completed = True
    assessment.completed_at = datetime.utcnow()
    
    # Update application with assessment results
    application.assessment_score = score
    application.assessment_data = {
        "answers": submission.answers,
        "evaluation": evaluation_result,
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    # Update application status based on score
    if passed:
        # Candidate passed assessment (70%+), can proceed to interview
        application.status = ApplicationStatus.INTERVIEW_SCHEDULED
        message = f"Congratulations! You scored {score}% and qualified for the interview round."
    else:
        # Candidate failed assessment
        application.status = ApplicationStatus.REJECTED
        message = f"Assessment completed with {score}%. Unfortunately, you need 70% or higher to proceed to interview."
    
    db.commit()
    
    return {
        "message": message,
        "score": score,
        "passed": passed,
        "total_points": evaluation_result["total_points"],
        "earned_points": evaluation_result["earned_points"],
        "next_step": "interview" if passed else "application_closed",
        "detailed_results": evaluation_result["detailed_results"]
    }


@router.get("/result/{application_id}")
def get_assessment_result(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assessment results"""
    
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check authorization
    if current_user.is_employer:
        # HR can view if it's their job
        if application.job.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    else:
        # Candidate can view their own
        if application.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    
    if not assessment or not assessment.completed:
        raise HTTPException(status_code=404, detail="Assessment not completed")
    
    return {
        "assessment_id": assessment.id,
        "score": assessment.score,
        "completed_at": assessment.completed_at,
        "questions": assessment.questions,
        "answers": assessment.answers if not current_user.is_employer else None  # Hide answers from HR
    }


@router.get("/interview-eligibility/{application_id}")
def check_interview_eligibility(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if candidate is eligible for interview (passed assessment with 70%+)"""
    
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check authorization
    if current_user.is_employer:
        # HR can check if it's their job
        if application.job.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    else:
        # Candidate can check their own
        if application.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Check assessment completion and score
    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    
    if not assessment or not assessment.completed:
        return {
            "eligible": False,
            "reason": "Assessment not completed",
            "assessment_score": None,
            "required_score": 70,
            "status": application.status
        }
    
    eligible = assessment.score >= 70
    
    return {
        "eligible": eligible,
        "reason": "Qualified for interview" if eligible else f"Assessment score ({assessment.score}%) below required 70%",
        "assessment_score": assessment.score,
        "required_score": 70,
        "status": application.status,
        "can_schedule_interview": eligible and application.status == ApplicationStatus.INTERVIEW_SCHEDULED
    }
