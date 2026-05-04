from pydantic import BaseModel
from typing import Dict, List, Optional, Any


class DLScoreRequest(BaseModel):
    application_id: int


class DLScoreResult(BaseModel):
    dl_scores: Dict[str, float]
    maturity_band: str
    overall_dl_score: float
    authenticity_score: float
    confidence_intervals: Dict[str, List[float]]
    modality_contributions: Dict[str, float]
    model_used: str


class BehavioralEventBatch(BaseModel):
    application_id: int
    events: List[Dict[str, Any]]
    stage: str = "assessment"