"""
BiLSTM Behavioral Sequence Model — DL Model 2.

Input:  event sequence extracted from proctoring violations
        (tab_switch, paste, face_not_detected, idle events)
Output: authenticity_score (0-1) + 256-dim embedding for fusion

Trained with WEAK SUPERVISION — no human labels needed.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional

EVENT_FEATURE_DIM = 5
EMBED_DIM = 256


class BehavioralBiLSTM(nn.Module):
    def __init__(
        self,
        input_dim: int = EVENT_FEATURE_DIM,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        embed_dim: int = EMBED_DIM,
    ):
        super().__init__()
        self.input_proj = nn.Sequential(nn.Linear(input_dim, 32), nn.ReLU())
        self.lstm = nn.LSTM(
            input_size=32, hidden_size=hidden_dim, num_layers=num_layers,
            batch_first=True, bidirectional=True,
            dropout=dropout if num_layers > 1 else 0,
        )
        lstm_out_dim = hidden_dim * 2
        self.attn = nn.Sequential(nn.Linear(lstm_out_dim, 64), nn.Tanh(), nn.Linear(64, 1))
        self.embed_proj = nn.Sequential(
            nn.LayerNorm(lstm_out_dim), nn.Linear(lstm_out_dim, embed_dim), nn.GELU()
        )
        self.authenticity_head = nn.Sequential(
            nn.Dropout(dropout), nn.Linear(embed_dim, 32), nn.ReLU(),
            nn.Linear(32, 1), nn.Sigmoid()
        )

    def forward(self, event_seq: torch.Tensor, mask: Optional[torch.Tensor] = None):
        x = self.input_proj(event_seq)
        lstm_out, _ = self.lstm(x)
        attn_w = self.attn(lstm_out).squeeze(-1)
        if mask is not None:
            attn_w = attn_w.masked_fill(mask == 0, float("-inf"))
        attn_w = F.softmax(attn_w, dim=1)
        pooled = (lstm_out * attn_w.unsqueeze(-1)).sum(dim=1)
        embedding = self.embed_proj(pooled)
        auth_score = self.authenticity_head(embedding).squeeze(-1)
        return embedding, auth_score