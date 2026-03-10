from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from assessment.models import Assessment
from assessment.schemas import AssessmentResponse, SubmitAssessmentRequest
from middleware.rate_limiter import rate_limiter
from datetime import datetime

router = APIRouter(prefix="/v1/assessment", tags=["Assessment"], dependencies=[Depends(rate_limiter)])

# Sample questions - in production, these would be dynamically generated based on job requirements
SAMPLE_QUESTIONS = [
    {
        "id": 1,
        "type": "coding",
        "title": "Implement a debounce function",
        "description": "Create a debounce function that delays the execution of a function until after a specified wait time has elapsed since the last time it was invoked.",
        "points": 30,
        "starter_code": "function debounce(func, wait) {\n  // Your code here\n}\n\n// Test\nconst log = debounce(() => console.log('Hello'), 1000);\nlog(); log(); log();"
    },
    {
        "id": 2,
        "type": "coding",
        "title": "Binary Tree Level Order Traversal",
        "description": "Given the root of a binary tree, return the level order traversal of its nodes' values.",
        "points": 40,
        "starter_code": "function levelOrder(root) {\n  // Your code here\n}"
    },
    {
        "id": 3,
        "type": "mcq",
        "title": "React Hooks",
        "description": "Which hook would you use to perform side effects in a functional component?",
        "options": ["useState", "useEffect", "useContext", "useMemo"],
        "points": 10
    },
    {
        "id": 4,
        "type": "text",
        "title": "System Design",
        "description": "Explain how you would design a scalable URL shortener service. Include database design, caching, and handling high traffic.",
        "points": 20
    }
]

@router.get("/start/{application_id}", response_model=AssessmentResponse)
def start_assessment(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start or retrieve assessment for an application"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot take assessments")
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status not in [ApplicationStatus.ASSESSMENT_SCHEDULED, ApplicationStatus.RESUME_SCREENED]:
        raise HTTPException(status_code=400, detail="Assessment not available for this application")
    
    # Check if assessment already exists
    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    
    if assessment:
        if assessment.completed:
            raise HTTPException(status_code=400, detail="Assessment already completed")
        return assessment
    
    # Create new assessment
    assessment = Assessment(
        application_id=application_id,
        questions=SAMPLE_QUESTIONS,
        started_at=datetime.utcnow()
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return assessment


@router.post("/submit/{assessment_id}")
def submit_assessment(
    assessment_id: int,
    submission: SubmitAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit assessment answers"""
    
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
    
    # Calculate score (simplified - in production, use AI for evaluation)
    total_points = sum(q["points"] for q in assessment.questions)
    earned_points = 0
    
    for question in assessment.questions:
        q_id = str(question["id"])
        if q_id in submission.answers:
            # Simple scoring: give full points if answer exists
            # In production, use AI to evaluate coding/text answers
            if question["type"] == "mcq":
                # Check correct answer (would be stored in DB)
                earned_points += question["points"] * 0.8  # Assume 80% correct
            else:
                earned_points += question["points"] * 0.7  # Assume 70% for coding/text
    
    score = int((earned_points / total_points) * 100)
    
    # Update assessment
    assessment.answers = submission.answers
    assessment.score = score
    assessment.completed = True
    assessment.completed_at = datetime.utcnow()
    
    # Update application
    application.assessment_score = score
    application.assessment_data = submission.answers
    application.status = ApplicationStatus.ASSESSMENT_COMPLETED
    
    db.commit()
    
    return {
        "message": "Assessment submitted successfully",
        "score": score,
        "total_points": total_points,
        "earned_points": int(earned_points)
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
