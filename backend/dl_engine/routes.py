"""
DL Engine API routes — mounted at /v1/dl/
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application
from dl_engine import get_dl_pipeline
from dl_engine.schemas import DLScoreRequest, DLScoreResult

router = APIRouter(prefix="/v1/dl", tags=["Deep Learning Engine"])


@router.post("/score/{application_id}", response_model=DLScoreResult)
async def run_dl_scoring(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run all 3 DL models on a completed application. HR only."""
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="HR access required")

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    pipeline = get_dl_pipeline()
    
    assessment_violations = (app.assessment_data or {}).get("violations", [])
    interview_violations = (app.interview_feedback or {}).get("violations", [])

    result = pipeline.score_candidate(
        interview_transcript=list(app.interview_transcript or []),
        assessment_violations=assessment_violations,
        interview_violations=interview_violations,
        assessment_score=float(app.assessment_score or 50),
        target_role=app.job.title if app.job else "General",
    )

    # Persist DL scores to application
    app.dl_scores = result
    db.commit()

    return result


@router.get("/score/{application_id}", response_model=DLScoreResult)
async def get_dl_scores(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get previously computed DL scores."""
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="HR access required")

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if not app.dl_scores:
        raise HTTPException(status_code=404, detail="DL scores not computed yet. POST to /score first.")

    return app.dl_scores


@router.get("/status")
async def dl_status():
    """Check which DL models are loaded."""
    pipeline = get_dl_pipeline()
    return {
        "deberta_loaded": pipeline.deberta is not None,
        "bilstm_loaded":  pipeline.bilstm is not None,
        "fusion_loaded":  pipeline.fusion is not None,
        "device":         str(pipeline.device),
        "mode": "full_dl" if pipeline.fusion else
                "deberta_only" if pipeline.deberta else "fallback",
    }