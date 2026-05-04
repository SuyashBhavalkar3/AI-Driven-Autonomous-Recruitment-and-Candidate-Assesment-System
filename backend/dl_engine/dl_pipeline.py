"""
DL Scoring Pipeline — main inference orchestrator.

Loads all 3 models on startup, exposes one method: score_candidate()
which takes interview transcript + proctoring violations + assessment score
and returns all 8 DL scores + maturity band + confidence intervals.

Falls back to rule-based scoring if models aren't trained yet.
"""
import os, logging, torch
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

from dl_engine.deberta_scorer import MultiTaskDeBERTa, SCORE_KEYS, MATURITY_BANDS
from dl_engine.bilstm_behavioral import BehavioralBiLSTM
from dl_engine.multimodal_fusion import MultimodalFusionNet
from dl_engine.event_processor import violations_to_event_sequence, compute_weak_authenticity_label

logger = logging.getLogger(__name__)

BASE = Path(__file__).parent / "models"
DEBERTA_PATH = BASE / "deberta_scorer"
BILSTM_PATH  = BASE / "bilstm_behavioral.pt"
FUSION_PATH  = BASE / "fusion_net.pt"

DEBERTA_BASE_MODEL = os.getenv("DL_DEBERTA_MODEL", "microsoft/deberta-v3-small")


class DLScoringPipeline:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.deberta: Optional[MultiTaskDeBERTa] = None
        self.bilstm:  Optional[BehavioralBiLSTM] = None
        self.fusion:  Optional[MultimodalFusionNet] = None
        self.tokenizer = None
        self._loaded = False

    async def load(self):
        logger.info(f"Loading DL pipeline on {self.device}...")
        try:
            if DEBERTA_PATH.exists() and (DEBERTA_PATH / "heads.pt").exists():
                self.deberta = MultiTaskDeBERTa(str(DEBERTA_PATH))
                heads = torch.load(DEBERTA_PATH / "heads.pt", map_location=self.device, weights_only=False)
                self.deberta.shared.load_state_dict(heads["shared"])
                self.deberta.score_heads.load_state_dict(heads["score_heads"])
                self.deberta.maturity_clf.load_state_dict(heads["maturity_clf"])
                self.deberta.to(self.device).eval()
                from transformers import AutoTokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(str(DEBERTA_PATH))
                logger.info("DeBERTa scorer loaded.")
            else:
                logger.warning("DeBERTa model not found — using fallback scoring. Run train_deberta_scorer.py first.")

            if BILSTM_PATH.exists():
                self.bilstm = BehavioralBiLSTM()
                self.bilstm.load_state_dict(torch.load(BILSTM_PATH, map_location=self.device, weights_only=False))
                self.bilstm.to(self.device).eval()
                logger.info("BiLSTM behavioral model loaded.")
            else:
                logger.warning("BiLSTM model not found — using rule-based behavioral scoring.")

            if FUSION_PATH.exists() and self.deberta and self.bilstm:
                self.fusion = MultimodalFusionNet()
                self.fusion.load_state_dict(torch.load(FUSION_PATH, map_location=self.device, weights_only=False))
                self.fusion.to(self.device).eval()
                logger.info("Fusion network loaded.")

            self._loaded = True
            logger.info("DL Pipeline ready.")
        except Exception as e:
            logger.error(f"DL pipeline load failed: {e}. Fallback mode active.")
            self._loaded = False

    def _transcript_to_text(self, transcript: List[Dict]) -> str:
        """Extract candidate responses from interview transcript."""
        if not transcript:
            return ""
        candidate_msgs = [
            entry.get("message", "")
            for entry in transcript
            if entry.get("speaker") in ("candidate", "user")
        ]
        return " [SEP] ".join(m for m in candidate_msgs if m)

    def score_candidate(
        self,
        interview_transcript: List[Dict],
        assessment_violations: List[Dict],
        interview_violations: List[Dict],
        assessment_score: float,
        target_role: str = "General",
    ) -> Dict[str, Any]:
        """
        Main inference method. Called from reports/service.py.
        
        Returns complete DL scoring result:
        {
          "dl_scores": {"initiative": 72.3, ...},
          "maturity_band": "Ready",
          "overall_dl_score": 74.1,
          "authenticity_score": 81.2,
          "confidence_intervals": {"initiative": [68.1, 76.5], ...},
          "modality_contributions": {"text": 55.2, "behavioral": 31.4, "task": 13.4},
          "model_used": "full_dl" | "deberta_only" | "fallback"
        }
        """
        all_violations = assessment_violations + interview_violations

        # ------ FALLBACK: no models trained yet ------
        if not self._loaded or not self.deberta:
            return self._fallback_score(
                interview_transcript, all_violations, assessment_score
            )

        # ------ STEP 1: Encode text with DeBERTa ------
        candidate_text = self._transcript_to_text(interview_transcript)
        role_tag = f"[ROLE: {target_role}] "
        full_text = role_tag + (candidate_text or "No responses recorded.")

        enc = self.tokenizer(
            full_text, max_length=512, padding="max_length",
            truncation=True, return_tensors="pt"
        )
        input_ids = enc["input_ids"].to(self.device)
        attn_mask = enc["attention_mask"].to(self.device)

        with torch.no_grad():
            text_emb = self.deberta.encode(input_ids, attn_mask)
            mean_scores, std_scores = self.deberta.predict_with_uncertainty(input_ids, attn_mask)
            maturity_logits = self.deberta.forward(input_ids, attn_mask)["maturity_logits"]
            maturity_idx = maturity_logits.argmax(dim=-1)[0].item()

        # ------ STEP 2: BiLSTM behavioral encoding ------
        event_seq = violations_to_event_sequence(all_violations).to(self.device)
        if self.bilstm:
            with torch.no_grad():
                behav_emb, auth_score_tensor = self.bilstm(event_seq)
            authenticity = float(auth_score_tensor[0].cpu()) * 100
        else:
            behav_emb = torch.zeros(1, 256).to(self.device)
            authenticity = compute_weak_authenticity_label(all_violations) * 100

        # ------ STEP 3: Multimodal fusion ------
        ts_tensor = torch.tensor([[assessment_score / 100.0]], dtype=torch.float32).to(self.device)
        if self.fusion:
            with torch.no_grad():
                fusion_out = self.fusion(text_emb, behav_emb, ts_tensor)
            final_scores = fusion_out["scores"][0].cpu().numpy()
            modality_w = fusion_out["modality_weights"][0].cpu().numpy()
            model_used = "full_dl"
        else:
            final_scores = mean_scores[0].cpu().numpy()
            modality_w = np.array([0.70, 0.20, 0.10])
            model_used = "deberta_only"

        # ------ Assemble result ------
        dl_scores = {k: round(float(final_scores[i]), 1) for i, k in enumerate(SCORE_KEYS)}
        std_vals  = std_scores[0].cpu().numpy()
        confidence_intervals = {
            k: [round(float(final_scores[i] - 1.96 * std_vals[i]), 1),
                round(float(final_scores[i] + 1.96 * std_vals[i]), 1)]
            for i, k in enumerate(SCORE_KEYS)
        }

        overall = float(np.mean(final_scores))
        return {
            "dl_scores": dl_scores,
            "maturity_band": MATURITY_BANDS[int(maturity_idx)],
            "overall_dl_score": round(overall, 1),
            "authenticity_score": round(authenticity, 1),
            "confidence_intervals": confidence_intervals,
            "modality_contributions": {
                "text": round(float(modality_w[0]) * 100, 1),
                "behavioral": round(float(modality_w[1]) * 100, 1),
                "task": round(float(modality_w[2]) * 100, 1),
            },
            "model_used": model_used,
        }

    def _fallback_score(
        self,
        transcript: List[Dict],
        violations: List[Dict],
        assessment_score: float,
    ) -> Dict[str, Any]:
        """Rule-based fallback when DL models aren't trained yet. Shows correct structure."""
        logger.info("Using fallback DL scoring (rule-based). Train models for real DL scores.")
        authenticity = compute_weak_authenticity_label(violations)
        base_score = min(100.0, (assessment_score * 0.5) + (authenticity * 100 * 0.3) + 20)
        scores = {k: round(base_score + (hash(k) % 20) - 10, 1) for k in SCORE_KEYS}
        overall = float(np.mean(list(scores.values())))
        if overall >= 86: band = "Elite"
        elif overall >= 66: band = "Ready"
        elif overall >= 41: band = "Developing"
        else: band = "Emerging"
        return {
            "dl_scores": scores,
            "maturity_band": band,
            "overall_dl_score": round(overall, 1),
            "authenticity_score": round(authenticity * 100, 1),
            "confidence_intervals": {k: [scores[k] - 10, scores[k] + 10] for k in SCORE_KEYS},
            "modality_contributions": {"text": 70.0, "behavioral": 20.0, "task": 10.0},
            "model_used": "fallback",
        }

