import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from authentication.database import SessionLocal
from applications.models import Application, ApplicationStatus
from assessment.models import Assessment
from job_management_module.models import Job
from authentication.models import User
from resume_parsing.models import Candidate
from notifications.models import Schedule

db = SessionLocal()

# Find the most recent application
app = db.query(Application).order_by(Application.id.desc()).first()

if not app:
    print("No applications found in DB.")
    sys.exit(1)

# Inject stellar assessment and interview data
app.assessment_score = 98.0
app.interview_score = 96.5
app.final_score = 97.0
app.status = ApplicationStatus.INTERVIEW_COMPLETED

# Mock Assessment Data
assessment = db.query(Assessment).filter(Assessment.application_id == app.id).first()
if assessment:
    assessment.mcq_score = 40.0
    assessment.dsa_score = 58.0
else:
    assessment = Assessment(application_id=app.id, mcq_score=40.0, dsa_score=58.0)
    db.add(assessment)

app.assessment_data = {
    "violations": [],
    "time_spent_by_section": {"MCQ": 12, "Coding": 25}
}

# Mock Interview Transcript
app.interview_transcript = [
    {"speaker": "ai", "text": "Can you explain your approach to scalable system design?"},
    {"speaker": "candidate", "text": "Absolutely. I design systems using microservices architecture to ensure independent scalability. I utilize asynchronous message brokers like Kafka to decouple services and ensure high throughput with low latency, and I implement robust caching layers using Redis to minimize database load."},
    {"speaker": "ai", "text": "That's an excellent and highly detailed answer. How do you handle database bottlenecks?"},
    {"speaker": "candidate", "text": "I proactively identify slow queries using query execution plans, add proper indexing, and use read replicas to distribute read-heavy workloads. For extreme scale, I would shard the database across multiple clusters based on user geography or tenant IDs."}
]

# Mock Interview Feedback
app.interview_feedback = {
    "duration_minutes": 45,
    "ai_interview_status": "completed",
    "violations": [],
    "skill_ratings": {
        "Communication": 95,
        "Technical Depth": 98,
        "Confidence": 92,
        "Problem Solving": 96
    },
    "topic_coverage": {
        "Behavioral": 85,
        "Coding": 95,
        "System Design": 90
    }
}

# Mock Deep Learning / ATS Scores
app.dl_scores = {
    "dl_scores": {
        "initiative": 96.5,
        "accountability": 98.2,
        "ownership": 97.5,
        "reliability": 99.0,
        "ethical_decision": 98.5,
        "team_impact": 95.8,
        "maturity": 97.2,
        "role_readiness": 96.8
    },
    "maturity_band": "Distinction / Outstanding",
    "overall_dl_score": 97,
    "authenticity_score": 99,
    "modality_contributions": {
        "text": 35,
        "behavioral": 30,
        "task": 35
    },
    "model_used": "DeBERTa-v3 / BiLSTM"
}

db.commit()

# Ensure any existing report gets a great summary
from reports.models import CandidateReport
report = db.query(CandidateReport).filter(CandidateReport.application_id == app.id).first()
if report:
    report.llm_summary_json = {
        "candidate_summary": "An exceptional candidate demonstrating profound technical expertise and excellent communication skills. Their system design knowledge is top-tier.",
        "interview_summary": "The candidate answered all questions flawlessly, showing deep understanding of microservices, database optimization, and scalable architectures.",
        "strengths": [
            "Profound knowledge of system architecture",
            "Clear and concise communication",
            "Strong problem-solving framework"
        ],
        "weaknesses": [
            "None identified during the assessment"
        ],
        "behavioral_observations": [
            "Maintained perfect eye contact",
            "Answered confidently without hesitation"
        ],
        "final_recommendation": "Hire - Distinction"
    }
    db.commit()

print(f"Success! Mocked distinction data for Application ID: {app.id}")
db.close()
