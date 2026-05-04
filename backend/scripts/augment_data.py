"""Augment labeled data 5x. Run after create_seed_data.py or convert_ell_to_training.py."""
import json
import random
import copy
import os

os.makedirs("data", exist_ok=True)

try:
    import nltk
    from nltk.corpus import wordnet
    nltk.download("wordnet", quiet=True)
    nltk.download("averaged_perceptron_tagger_eng", quiet=True)
    NLTK_OK = True
except ImportError:
    NLTK_OK = False


def synonym_replace(text, ratio=0.15):
    if not NLTK_OK:
        return text
    words = text.split()
    tags = nltk.pos_tag(words)
    result = list(words)
    for i, (w, t) in enumerate(tags):
        if random.random() > ratio:
            continue
        pos = None
        if t.startswith("NN"):
            pos = wordnet.NOUN
        elif t.startswith("VB"):
            pos = wordnet.VERB
        if not pos:
            continue
        syns = wordnet.synsets(w, pos=pos)
        lemmas = [
            l.name() for s in syns[:2]
            for l in s.lemmas()
            if l.name() != w and "_" not in l.name()
        ]
        if lemmas:
            result[i] = random.choice(lemmas)
    return " ".join(result)


def label_noise(labels, std=3.5):
    return {
        k: round(max(0, min(100, v + random.gauss(0, std))), 1)
        for k, v in labels.items()
    }


def main():
    input_path = "data/labeled_responses.jsonl"
    output_path = "data/augmented_train.jsonl"

    if not os.path.exists(input_path):
        print(f"ERROR: {input_path} not found.")
        print("Run create_seed_data.py or convert_ell_to_training.py first.")
        return

    examples = []
    with open(input_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                examples.append(json.loads(line))

    print(f"Loaded {len(examples)} original examples")

    augmented = list(examples)
    for ex in examples:
        for i in range(4):
            new = copy.deepcopy(ex)
            new["candidate_id"] = f"{ex['candidate_id']}_aug{i}"
            new["responses"] = [synonym_replace(r) for r in ex["responses"]]
            new["labels"] = label_noise(ex["labels"])
            events = new.get("behavioral_events", [])
            if events:
                keep = max(1, int(len(events) * random.uniform(0.7, 1.0)))
                new["behavioral_events"] = random.sample(events, keep)
            augmented.append(new)

    random.shuffle(augmented)

    with open(output_path, "w", encoding="utf-8") as f:
        for ex in augmented:
            f.write(json.dumps(ex) + "\n")

    print(f"Augmented: {len(examples)} -> {len(augmented)} examples")
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()