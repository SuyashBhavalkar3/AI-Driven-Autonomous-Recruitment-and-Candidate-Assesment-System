"""
Train BiLSTM behavioral model. Uses weak supervision — no human labels needed.
Run: python scripts/train_bilstm.py --data data/augmented_train.jsonl --epochs 30
"""
import argparse, os, sys, torch, json
import numpy as np
sys.path.insert(0, os.path.abspath("."))

from torch.utils.data import DataLoader, TensorDataset
from dl_engine.bilstm_behavioral import BehavioralBiLSTM
from dl_engine.event_processor import violations_to_event_sequence, EVENT_FEATURE_DIM

MAX_EVENTS = 50


def load_event_data(jsonl_path):
    seqs, labels = [], []
    with open(jsonl_path) as f:
        for line in f:
            ex = json.loads(line)
            events = ex.get("behavioral_events", [])
            viol_fmt = [{"type": e.get("event_type",""), "timestamp": str(e.get("timestamp_ms",""))} for e in events]
            seq_tensor = violations_to_event_sequence(viol_fmt, MAX_EVENTS)[0]
            seqs.append(seq_tensor)
            paste_count = sum(1 for e in events if "paste" in e.get("event_type","").lower())
            revision_count = sum(1 for e in events if "revision" in e.get("event_type","").lower())
            label = 0.0 if paste_count >= 2 or revision_count == 0 else 1.0
            labels.append(label)
    return torch.stack(seqs), torch.tensor(labels)


def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    seqs, labels = load_event_data(args.data)
    n = len(seqs)
    idx = torch.randperm(n)
    n_val = max(int(n * 0.15), 3)
    t_idx, v_idx = idx[n_val:], idx[:n_val]
    train_dl = DataLoader(TensorDataset(seqs[t_idx], labels[t_idx]), batch_size=32, shuffle=True)
    val_dl   = DataLoader(TensorDataset(seqs[v_idx],  labels[v_idx]),  batch_size=32)

    model = BehavioralBiLSTM().to(device)
    opt   = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    crit  = torch.nn.BCELoss()
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)
    best_acc = 0.0

    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0
        for sb, lb in train_dl:
            opt.zero_grad()
            _, scores = model(sb.to(device))
            loss = crit(scores, lb.to(device))
            loss.backward(); opt.step(); total_loss += loss.item()
        sched.step()

        model.eval(); correct = 0
        with torch.no_grad():
            for sb, lb in val_dl:
                _, scores = model(sb.to(device))
                correct += ((scores.cpu() > 0.5).float() == lb).sum().item()
        acc = correct / len(v_idx)
        print(f"Epoch {epoch:3d}: loss={total_loss/len(train_dl):.4f}  val_acc={acc:.3f}")

        if acc > best_acc:
            best_acc = acc
            os.makedirs(os.path.dirname(args.out), exist_ok=True)
            torch.save(model.state_dict(), args.out)
            print(f"  Saved (acc={acc:.3f})")

    print(f"Done. Best val accuracy: {best_acc:.3f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data/augmented_train.jsonl")
    p.add_argument("--epochs", type=int, default=30)
    p.add_argument("--out", default="dl_engine/models/bilstm_behavioral.pt")
    train(p.parse_args())