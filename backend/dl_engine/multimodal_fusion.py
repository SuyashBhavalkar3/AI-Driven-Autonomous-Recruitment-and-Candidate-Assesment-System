"""
Cross-Attention Multimodal Fusion Network — DL Model 3.

Both DeBERTa encoder and BiLSTM output 256-dim embeddings:
  text_emb   (256-dim) — from deberta.encode() which applies shared projection 768->256
  behav_emb  (256-dim) — from BiLSTM attention pooling
  task_score (1-dim)   — normalized assessment score 0-1
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Dict

SCORE_KEYS = [
    "initiative", "accountability", "ownership", "reliability",
    "ethical_decision", "team_impact", "maturity", "role_readiness",
]


class CrossAttentionBlock(nn.Module):
    """
    query attends to kv. Both same dim (256).
    256 / 4 heads = 64 head_dim  OK
    """
    def __init__(self, dim: int = 256, heads: int = 4, dropout: float = 0.1):
        super().__init__()
        assert dim % heads == 0
        self.heads    = heads
        self.head_dim = dim // heads
        self.scale    = self.head_dim ** -0.5

        self.q_proj = nn.Linear(dim, dim, bias=False)
        self.k_proj = nn.Linear(dim, dim, bias=False)
        self.v_proj = nn.Linear(dim, dim, bias=False)
        self.o_proj = nn.Linear(dim, dim, bias=False)
        self.dropout = nn.Dropout(dropout)
        self.norm    = nn.LayerNorm(dim)

    def forward(self, query: torch.Tensor, kv: torch.Tensor) -> torch.Tensor:
        B, D = query.shape
        q = self.q_proj(query).view(B, 1, self.heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(kv).view(B, 1, self.heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(kv).view(B, 1, self.heads, self.head_dim).transpose(1, 2)
        attn = self.dropout(F.softmax(torch.matmul(q, k.transpose(-2, -1)) * self.scale, dim=-1))
        out  = torch.matmul(attn, v).transpose(1, 2).contiguous().view(B, D)
        return self.norm(query + self.o_proj(out))


class ModalityGate(nn.Module):
    def __init__(self, text_dim: int, behav_dim: int, task_dim: int, fused_dim: int):
        super().__init__()
        self.gate = nn.Sequential(
            nn.Linear(text_dim + behav_dim + task_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 3),
            nn.Softmax(dim=-1),
        )
        self.text_proj  = nn.Linear(text_dim,  fused_dim)
        self.behav_proj = nn.Linear(behav_dim, fused_dim)
        self.task_proj  = nn.Linear(task_dim,  fused_dim)

    def forward(self, text_emb, behav_emb, task_emb):
        w = self.gate(torch.cat([text_emb, behav_emb, task_emb], dim=-1))
        fused = (w[:, 0:1] * self.text_proj(text_emb) +
                 w[:, 1:2] * self.behav_proj(behav_emb) +
                 w[:, 2:3] * self.task_proj(task_emb))
        return fused, w


class MultimodalFusionNet(nn.Module):
    """
    text_dim=256 because deberta.encode() returns shared-projected embedding (768->256).
    behav_dim=256 from BiLSTM.
    Both are same dim so CrossAttentionBlock uses a single dim parameter.
    """
    def __init__(
        self,
        text_dim:    int   = 256,
        behav_dim:   int   = 256,
        task_dim_in: int   = 1,
        fused_dim:   int   = 256,
        dropout:     float = 0.15,
    ):
        super().__init__()
        self.task_encoder = nn.Sequential(
            nn.Linear(task_dim_in, 32), nn.GELU(), nn.Linear(32, 64)
        )
        task_emb_dim = 64

        self.text_to_behav = CrossAttentionBlock(dim=256, heads=4, dropout=dropout)
        self.behav_to_text = CrossAttentionBlock(dim=256, heads=4, dropout=dropout)

        self.gate = ModalityGate(
            text_dim=text_dim, behav_dim=behav_dim,
            task_dim=task_emb_dim, fused_dim=fused_dim,
        )
        self.fusion_mlp = nn.Sequential(
            nn.LayerNorm(fused_dim), nn.Dropout(dropout),
            nn.Linear(fused_dim, fused_dim), nn.GELU(), nn.Dropout(dropout),
        )
        self.score_heads = nn.ModuleList([
            nn.Sequential(nn.Linear(fused_dim, 32), nn.GELU(), nn.Linear(32, 1), nn.Sigmoid())
            for _ in SCORE_KEYS
        ])

    def forward(self, text_emb, behav_emb, task_score, labels=None):
        task_emb      = self.task_encoder(task_score)
        text_refined  = self.text_to_behav(text_emb,  behav_emb)
        behav_refined = self.behav_to_text(behav_emb, text_emb)
        fused, weights = self.gate(text_refined, behav_refined, task_emb)
        fused  = self.fusion_mlp(fused)
        scores = torch.stack([h(fused).squeeze(-1) for h in self.score_heads], dim=1) * 100.0
        out = {"scores": scores, "modality_weights": weights}
        if labels is not None:
            out["loss"] = F.mse_loss(scores / 100.0, labels / 100.0)
        return out