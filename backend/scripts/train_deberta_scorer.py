"""
Fine-tune DeBERTa-v3-small as multi-task job readiness scorer.
Run: python scripts/train_deberta_scorer.py --train data/augmented_train.jsonl --epochs 10
"""
import argparse, os, sys, json, torch
import numpy as np
sys.path.insert(0, os.path.abspath("."))

from torch.utils.data import DataLoader, Dataset, random_split
from transformers import AutoTokenizer, get_linear_schedule_with_warmup
from torch.optim import AdamW
from dl_engine.deberta_scorer import MultiTaskDeBERTa, SCORE_KEYS

MODEL_NAME = "microsoft/deberta-v3-small"


class ResponseDataset(Dataset):
    def __init__(self, jsonl_path, max_length=512):
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.max_length = max_length
        self.examples = []
        with open(jsonl_path) as f:
            for line in f:
                ex = json.loads(line)
                if ex.get("labels"): self.examples.append(ex)
        print(f"Loaded {len(self.examples)} labeled examples")

    def __len__(self): return len(self.examples)

    def __getitem__(self, idx):
        ex = self.examples[idx]
        text = f"[ROLE: {ex.get('target_role','General')}] " + " [SEP] ".join(ex["responses"])
        enc = self.tokenizer(text, max_length=self.max_length, padding="max_length",
                             truncation=True, return_tensors="pt")
        labels = ex.get("labels", {})
        label_vec = torch.tensor([labels.get(k, 50.0)/100.0 for k in SCORE_KEYS], dtype=torch.float32)
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "labels": label_vec,
        }


def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")

    ds = ResponseDataset(args.train)
    n_val = max(int(len(ds) * 0.15), 5)
    train_ds, val_ds = random_split(ds, [len(ds) - n_val, n_val])
    train_dl = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=0)
    val_dl   = DataLoader(val_ds, batch_size=args.batch, num_workers=0)

    model = MultiTaskDeBERTa(MODEL_NAME).to(device)

    # Freeze first 6 backbone layers for warmup
    for i, layer in enumerate(model.backbone.encoder.layer):
        if i < 6:
            for p in layer.parameters(): p.requires_grad = False

    backbone_params = [p for p in model.backbone.parameters() if p.requires_grad]
    head_params = list(model.shared.parameters()) + list(model.score_heads.parameters()) + list(model.maturity_clf.parameters())
    opt = AdamW([{"params": backbone_params, "lr": args.lr},
                 {"params": head_params, "lr": args.lr * 5}], weight_decay=0.01)

    total_steps = len(train_dl) * args.epochs
    scheduler = get_linear_schedule_with_warmup(opt, total_steps // 10, total_steps)

    best_mae = float("inf")
    os.makedirs(args.out, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        if epoch == 4:
            print("Unfreezing all backbone layers...")
            for p in model.backbone.parameters(): p.requires_grad = True

        model.train(); train_loss = 0
        for batch in train_dl:
            opt.zero_grad()
            out = model(batch["input_ids"].to(device), batch["attention_mask"].to(device),
                        labels=batch["labels"].to(device))
            out["loss"].backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step(); scheduler.step()
            train_loss += out["loss"].item()

        model.eval(); all_p, all_l = [], []
        with torch.no_grad():
            for batch in val_dl:
                out = model(batch["input_ids"].to(device), batch["attention_mask"].to(device))
                all_p.append(out["scores"].cpu().numpy())
                all_l.append(batch["labels"].numpy())

        preds  = np.concatenate(all_p) * 100
        labels = np.concatenate(all_l) * 100
        mae = np.abs(preds - labels).mean()
        print(f"Epoch {epoch}: train_loss={train_loss/len(train_dl):.4f}  val_MAE={mae:.2f}")

        if mae < best_mae:
            best_mae = mae
            model.backbone.save_pretrained(args.out)
            model.backbone.config.save_pretrained(args.out)
            ds.tokenizer.save_pretrained(args.out)
            torch.save({
                "shared": model.shared.state_dict(),
                "score_heads": model.score_heads.state_dict(),
                "maturity_clf": model.maturity_clf.state_dict(),
                "epoch": epoch, "val_mae": mae,
            }, os.path.join(args.out, "heads.pt"))
            print(f"  Saved (MAE={mae:.2f})")

    print(f"Done. Best val MAE: {best_mae:.2f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--train", default="data/augmented_train.jsonl")
    p.add_argument("--epochs", type=int, default=10)
    p.add_argument("--lr", type=float, default=2e-5)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--out", default="dl_engine/models/deberta_scorer")
    train(p.parse_args())