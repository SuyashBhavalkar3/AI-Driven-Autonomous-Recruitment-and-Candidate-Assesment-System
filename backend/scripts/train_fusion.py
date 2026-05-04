"""
Train cross-attention fusion network.
Requires trained DeBERTa + BiLSTM first.
Run: python scripts/train_fusion.py --train data/augmented_train.jsonl --epochs 20
"""
import argparse, os, sys, json, torch
sys.path.insert(0, os.path.abspath("."))

from torch.utils.data import DataLoader, TensorDataset, random_split
from transformers import AutoTokenizer
from dl_engine.deberta_scorer import MultiTaskDeBERTa, SCORE_KEYS
from dl_engine.bilstm_behavioral import BehavioralBiLSTM
from dl_engine.multimodal_fusion import MultimodalFusionNet
from dl_engine.event_processor import violations_to_event_sequence
import numpy as np


def build_embeddings(jsonl_path, deberta_path, bilstm_path, batch_size=8):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    deberta = MultiTaskDeBERTa(deberta_path)
    heads = torch.load(os.path.join(deberta_path, "heads.pt"), map_location=device, weights_only=False)
    deberta.shared.load_state_dict(heads["shared"])
    deberta.to(device).eval()
    for p in deberta.parameters(): p.requires_grad = False
    tokenizer = AutoTokenizer.from_pretrained(deberta_path)

    bilstm = BehavioralBiLSTM()
    bilstm.load_state_dict(torch.load(bilstm_path, map_location=device, weights_only=False))
    bilstm.to(device).eval()
    for p in bilstm.parameters(): p.requires_grad = False

    text_embs, behav_embs, task_scores_list, label_vecs = [], [], [], []

    with open(jsonl_path) as f:
        examples = [json.loads(l) for l in f if json.loads(l).get("labels")]

    for ex in examples:
        text = f"[ROLE: {ex.get('target_role','General')}] " + " [SEP] ".join(ex["responses"])
        enc = tokenizer(text, max_length=512, padding="max_length", truncation=True, return_tensors="pt")
        events = ex.get("behavioral_events", [])
        viol_fmt = [{"type": e.get("event_type",""), "timestamp": str(e.get("timestamp_ms",""))} for e in events]
        event_seq = violations_to_event_sequence(viol_fmt)

        with torch.no_grad():
            te = deberta.encode(enc["input_ids"].to(device), enc["attention_mask"].to(device))
            be, _ = bilstm(event_seq.to(device))

        text_embs.append(te.cpu())
        behav_embs.append(be.cpu())
        task_scores_list.append(torch.tensor([[ex.get("task_score", 50.0) / 100.0]]))
        labels = ex["labels"]
        label_vecs.append(torch.tensor([labels.get(k, 50.0) for k in SCORE_KEYS]))

    return (torch.cat(text_embs), torch.cat(behav_embs),
            torch.cat(task_scores_list), torch.stack(label_vecs))


def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("Extracting embeddings from frozen backbone models...")
    text_embs, behav_embs, task_scores, labels = build_embeddings(
        args.train, args.deberta_path, args.bilstm_path
    )

    n = len(text_embs); n_val = max(int(n * 0.15), 3)
    idx = torch.randperm(n)
    t_idx, v_idx = idx[n_val:], idx[:n_val]

    train_dl = DataLoader(
        TensorDataset(text_embs[t_idx], behav_embs[t_idx], task_scores[t_idx], labels[t_idx]),
        batch_size=16, shuffle=True)
    val_dl = DataLoader(
        TensorDataset(text_embs[v_idx], behav_embs[v_idx], task_scores[v_idx], labels[v_idx]),
        batch_size=16)

    fusion = MultimodalFusionNet().to(device)
    opt = torch.optim.AdamW(fusion.parameters(), lr=3e-4, weight_decay=1e-3)
    sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, patience=3, factor=0.5)

    best_loss = float("inf")
    for epoch in range(1, args.epochs + 1):
        fusion.train(); total_loss = 0
        for te, be, ts, lb in train_dl:
            opt.zero_grad()
            out = fusion(te.to(device), be.to(device), ts.to(device), labels=lb.to(device))
            out["loss"].backward(); opt.step(); total_loss += out["loss"].item()

        fusion.eval(); val_loss = 0
        with torch.no_grad():
            for te, be, ts, lb in val_dl:
                out = fusion(te.to(device), be.to(device), ts.to(device), labels=lb.to(device))
                val_loss += out["loss"].item()
        val_loss /= len(val_dl); sched.step(val_loss)
        print(f"Epoch {epoch:3d}: train={total_loss/len(train_dl):.4f}  val={val_loss:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            torch.save(fusion.state_dict(), args.out)
            print(f"  Saved (val_loss={val_loss:.4f})")

    print(f"Done. Best fusion val loss: {best_loss:.4f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--train", default="data/augmented_train.jsonl")
    p.add_argument("--deberta_path", default="dl_engine/models/deberta_scorer")
    p.add_argument("--bilstm_path", default="dl_engine/models/bilstm_behavioral.pt")
    p.add_argument("--epochs", type=int, default=20)
    p.add_argument("--out", default="dl_engine/models/fusion_net.pt")
    train(p.parse_args())
