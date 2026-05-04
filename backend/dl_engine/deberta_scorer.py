"""
Multi-Task DeBERTa Scorer — DL Model 1.

Fine-tuned DeBERTa-v3-small with 8 regression heads:
  initiative, accountability, ownership, reliability,
  ethical_decision, team_impact, maturity, role_readiness

Also includes:
  - Maturity band classification head (4 classes)
  - Monte Carlo Dropout for confidence intervals
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoModel, AutoConfig
from typing import Optional, Tuple, Dict

SCORE_KEYS = [
    "initiative", "accountability", "ownership", "reliability",
    "ethical_decision", "team_impact", "maturity", "role_readiness",
]
MATURITY_BANDS = ["Emerging", "Developing", "Ready", "Elite"]

SCORE_WEIGHTS = {
    "initiative": 1.2, "accountability": 1.5, "ownership": 1.3,
    "reliability": 1.2, "ethical_decision": 1.0, "team_impact": 1.0,
    "maturity": 1.4, "role_readiness": 1.1,
}
WEIGHT_TENSOR = torch.tensor([SCORE_WEIGHTS[k] for k in SCORE_KEYS], dtype=torch.float32)


class ScoreHead(nn.Module):
    def __init__(self, hidden: int = 256, dropout: float = 0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden, 64),
            nn.GELU(),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


class MultiTaskDeBERTa(nn.Module):
    def __init__(
        self,
        model_name: str = "microsoft/deberta-v3-small",
        hidden_dim: int = 256,
        dropout: float = 0.15,
        mc_samples: int = 10,
    ):
        super().__init__()
        self.mc_samples = mc_samples
        config = AutoConfig.from_pretrained(model_name)
        config.hidden_dropout_prob = dropout
        config.attention_probs_dropout_prob = dropout
        self.backbone = AutoModel.from_pretrained(model_name, config=config)
        backbone_dim = config.hidden_size

        self.shared = nn.Sequential(
            nn.LayerNorm(backbone_dim),
            nn.Dropout(dropout),
            nn.Linear(backbone_dim, hidden_dim),
            nn.GELU(),
            nn.LayerNorm(hidden_dim),
        )
        self.score_heads = nn.ModuleList([ScoreHead(hidden_dim, dropout) for _ in SCORE_KEYS])
        self.maturity_clf = nn.Sequential(nn.Dropout(dropout), nn.Linear(hidden_dim, 4))
        self.mc_dropout = nn.Dropout(p=0.15)

    def encode(self, input_ids, attention_mask, token_type_ids=None):
        out = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        cls = out.last_hidden_state[:, 0, :]
        return self.shared(cls)

    def forward(self, input_ids, attention_mask, token_type_ids=None, labels=None):
        shared_repr = self.mc_dropout(self.encode(input_ids, attention_mask, token_type_ids))
        scores = torch.stack([head(shared_repr) for head in self.score_heads], dim=1)
        maturity_logits = self.maturity_clf(shared_repr)
        output = {"scores": scores, "maturity_logits": maturity_logits}

        if labels is not None:
            weights = WEIGHT_TENSOR.to(scores.device)
            reg_loss = ((scores - labels) ** 2 * weights).mean()
            overall = (scores * weights / weights.sum()).sum(dim=1)
            mat_labels = torch.zeros(overall.shape[0], dtype=torch.long, device=overall.device)
            mat_labels[overall >= 0.86] = 3
            mat_labels[(overall >= 0.66) & (overall < 0.86)] = 2
            mat_labels[(overall >= 0.41) & (overall < 0.66)] = 1
            clf_loss = nn.CrossEntropyLoss()(maturity_logits, mat_labels)
            output["loss"] = reg_loss + 0.3 * clf_loss

        return output

    @torch.no_grad()
    def predict_with_uncertainty(self, input_ids, attention_mask):
        self.train()
        all_scores = [self.forward(input_ids, attention_mask)["scores"] for _ in range(self.mc_samples)]
        self.eval()
        stacked = torch.stack(all_scores)
        return stacked.mean(0) * 100, stacked.std(0) * 100