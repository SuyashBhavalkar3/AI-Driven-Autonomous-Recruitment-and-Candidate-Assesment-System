"""
Event Processor — converts proctoring violations (already stored in your DB)
into fixed-length feature sequences for the BiLSTM model.

Your existing proctoring/routes.py stores violations as:
  [{"type": "tab_switch", "timestamp": "...", "details": "...", "stage": "..."}]

This module reads that JSON and builds the BiLSTM input tensor.
"""
import torch
import numpy as np
from typing import List, Dict, Any

EVENT_MAP = {
    "tab_switch": 1,
    "face_not_detected": 2,
    "multiple_faces": 3,
    "paste": 4,
    "idle": 5,
    "tab_hidden": 1,  # alias
    "focus_lost": 1,  # alias
}
MAX_EVENTS = 50
EVENT_FEATURE_DIM = 5


def violations_to_event_sequence(violations: List[Dict[str, Any]], max_events: int = MAX_EVENTS) -> torch.Tensor:
    """
    Convert your existing proctoring violations list into a BiLSTM input tensor.
    
    violations: list from application.assessment_data["violations"] or
                application.interview_feedback["violations"]
    
    Returns: (1, max_events, 5) tensor ready for BiLSTM inference
    """
    if not violations:
        return torch.zeros(1, max_events, EVENT_FEATURE_DIM)

    # Sort by timestamp
    sorted_violations = sorted(violations, key=lambda x: x.get("timestamp", ""))
    
    timestamps = []
    for v in sorted_violations:
        ts = v.get("timestamp", "")
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            timestamps.append(dt.timestamp())
        except Exception:
            timestamps.append(0.0)

    max_ts = max(timestamps) if timestamps else 1.0
    min_ts = min(timestamps) if timestamps else 0.0
    ts_range = max(max_ts - min_ts, 1.0)

    vecs = []
    for i, v in enumerate(sorted_violations[:max_events]):
        etype = EVENT_MAP.get(v.get("type", "").lower(), 0) / 5.0
        ts_norm = (timestamps[i] - min_ts) / ts_range if timestamps else 0.0
        
        vtype = v.get("type", "").lower()
        paste_flag = 1.0 if "paste" in vtype else 0.0
        face_flag  = 1.0 if "face" in vtype or "multiple" in vtype else 0.0
        tab_flag   = 1.0 if "tab" in vtype or "focus" in vtype else 0.0
        
        vecs.append([etype, ts_norm, paste_flag, face_flag, tab_flag])

    while len(vecs) < max_events:
        vecs.append([0.0] * EVENT_FEATURE_DIM)

    tensor = torch.tensor([vecs], dtype=torch.float32)  # (1, max_events, 5)
    return tensor


def compute_weak_authenticity_label(violations: List[Dict[str, Any]]) -> float:
    """
    Rule-based authenticity estimate (used when model isn't trained yet).
    Returns 0.0-1.0 (1.0 = fully authentic, 0.0 = suspicious).
    """
    if not violations:
        return 1.0

    paste_count = sum(1 for v in violations if "paste" in v.get("type", "").lower())
    face_violations = sum(1 for v in violations if "face" in v.get("type", "").lower())
    tab_switches = sum(1 for v in violations if "tab" in v.get("type", "").lower())
    total = len(violations)

    penalty = 0.0
    penalty += min(paste_count * 0.15, 0.45)
    penalty += min(face_violations * 0.08, 0.32)
    penalty += min(tab_switches * 0.05, 0.25)

    return round(max(0.0, 1.0 - penalty), 3)