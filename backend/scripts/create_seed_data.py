"""
Creates 30 starter labeled examples with realistic responses.
You must review and adjust the scores — these are starting points only.
Run: python scripts/create_seed_data.py
"""
import json, random, os
os.makedirs("data", exist_ok=True)

TEMPLATES = [
    {
        "responses": [
            "I noticed our deployment pipeline was failing silently. Without being asked, I wrote a monitoring script that alerted the team within seconds of any failure.",
            "When I realized I had introduced the bug causing the outage, I immediately owned it publicly in the team channel and worked through the night to fix it.",
        ],
        "labels": {"initiative": 88, "accountability": 92, "ownership": 85, "reliability": 82,
                   "ethical_decision": 78, "team_impact": 75, "maturity": 84, "role_readiness": 86},
    },
    {
        "responses": [
            "The system went down and I waited for someone else to fix it. It wasn't really my area.",
            "I submitted my work but there were some issues. The deadline was tight so I couldn't really check properly.",
        ],
        "labels": {"initiative": 28, "accountability": 22, "ownership": 25, "reliability": 30,
                   "ethical_decision": 45, "team_impact": 35, "maturity": 32, "role_readiness": 28},
    },
    {
        "responses": [
            "I take full responsibility for project outcomes. When my team was struggling, I reorganized the workload and stayed late to help.",
            "I volunteered to lead the migration project even though it wasn't required. The team completed it two weeks ahead of schedule.",
        ],
        "labels": {"initiative": 82, "accountability": 88, "ownership": 84, "reliability": 80,
                   "ethical_decision": 76, "team_impact": 90, "maturity": 82, "role_readiness": 83},
    },
    {
        "responses": [
            "If the system fails it's usually the infrastructure team's fault. I just write the code.",
            "I prefer not to take ownership of things outside my immediate ticket scope.",
        ],
        "labels": {"initiative": 20, "accountability": 18, "ownership": 15, "reliability": 40,
                   "ethical_decision": 35, "team_impact": 22, "maturity": 28, "role_readiness": 25},
    },
    {
        "responses": [
            "When a client complained about data inconsistency, I proactively audited all our ETL pipelines before anyone asked. Found 3 bugs.",
            "I always document my work thoroughly because I know the next person will need to maintain it.",
        ],
        "labels": {"initiative": 78, "accountability": 80, "ownership": 76, "reliability": 85,
                   "ethical_decision": 82, "team_impact": 72, "maturity": 78, "role_readiness": 79},
    },
]

examples = []
for i, template in enumerate(TEMPLATES):
    for j in range(6):
        ex = {
            "candidate_id": f"seed_{i}_{j}",
            "responses": template["responses"],
            "behavioral_events": [
                {"event_type": "revision", "timestamp_ms": random.randint(5000, 30000), "payload": {"edit_count": random.randint(1, 8)}},
                {"event_type": "idle_start", "timestamp_ms": random.randint(40000, 80000), "payload": {}},
            ],
            "task_score": random.uniform(40, 95),
            "target_role": random.choice(["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer"]),
            "labels": {k: min(100, max(0, v + random.randint(-5, 5))) for k, v in template["labels"].items()},
        }
        examples.append(ex)

with open("data/labeled_responses.jsonl", "w") as f:
    for ex in examples:
        f.write(json.dumps(ex) + "\n")

print(f"Created {len(examples)} seed examples in data/labeled_responses.jsonl")
print("IMPORTANT: Review and adjust scores in the file before training!")