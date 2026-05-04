import matplotlib
matplotlib.use("Agg")
import asyncio
import base64
import io
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from groq import Groq
from jinja2 import Template
   # Use non-GUI backend for servers

from matplotlib import pyplot as plt

from sqlalchemy.orm import Session

from applications.models import Application
from assessment.models import Assessment
from authentication.database import SessionLocal
from reports.models import CandidateReport
from dl_engine import get_dl_pipeline

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
REPORTS_DIR = Path("backend/generated_reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

REPORT_TEMPLATE = Template(
    """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 0; }
      body { 
        font-family: 'Helvetica', 'Arial', sans-serif; 
        color: #1a1a1a; 
        margin: 0; 
        padding: 0;
        background-color: #ffffff;
        font-size: 11px;
      }
      .page {
        padding: 15mm;
        page-break-after: always;
        position: relative;
        height: 267mm; /* Full A4 height minus padding */
        overflow: hidden;
      }
      .page:last-child {
        page-break-after: avoid;
      }
      header {
        border-bottom: 2px solid #c5a059;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .brand {
        color: #c5a059;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 5px;
      }
      h1 { font-size: 26px; margin: 0; font-weight: 300; letter-spacing: -1px; }
      h2 { font-size: 16px; margin: 15px 0 10px; border-left: 3px solid #c5a059; padding-left: 8px; text-transform: uppercase; letter-spacing: 1px; }
      h3 { font-size: 13px; margin: 10px 0 5px; color: #4a4a4a; }
      
      .executive-summary {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
      }
      .score-card {
        background: #fdfbf7;
        border: 1px solid #e8e0d0;
        padding: 15px;
        border-radius: 4px;
        flex: 1;
      }
      .maturity-band {
        font-size: 20px;
        color: #c5a059;
        font-weight: bold;
        margin: 5px 0;
      }
      .overall-score {
        font-size: 36px;
        font-weight: 200;
        margin: 0;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 15px;
      }
      .info-item .label {
        font-size: 8px;
        text-transform: uppercase;
        color: #888;
        letter-spacing: 1px;
        margin-bottom: 3px;
      }
      .info-item .value {
        font-size: 12px;
        font-weight: 600;
      }

      .section-card {
        background: #ffffff;
        border: 1px solid #eeeeee;
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 2px;
      }
      
      .dl-scores-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      .dl-stat {
        text-align: center;
        padding: 10px 5px;
        background: #f9f9f9;
        border-radius: 4px;
      }
      .dl-stat .value { font-size: 16px; font-weight: 700; color: #1a1a1a; }
      .dl-stat .label { font-size: 7px; color: #666; text-transform: uppercase; margin-top: 3px; }

      .recommendation-banner {
        background: #1a1a1a;
        color: #ffffff;
        padding: 15px;
        text-align: center;
        border-radius: 4px;
      }
      .recommendation-banner .value { font-size: 20px; font-weight: 700; color: #c5a059; }

      ul { padding-left: 15px; margin: 5px 0; }
      li { margin-bottom: 4px; font-size: 11px; line-height: 1.4; }
      
      .chart-container {
        text-align: center;
        margin: 5px 0;
      }
      .chart-container img {
        max-width: 100%;
        height: auto;
      }
      
      .footer {
        position: absolute;
        bottom: 10mm;
        left: 15mm;
        right: 15mm;
        font-size: 8px;
        color: #ccc;
        border-top: 1px solid #eee;
        padding-top: 5px;
      }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    </style>
  </head>
  <body>
    <!-- Page 1: Executive Overview & Technicals -->
    <div class="page">
      <div class="brand">HireMintora Executive Summary</div>
      <header>
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1>{{ candidate_name }}</h1>
            <div style="font-size: 14px; color: #666;">{{ job_title }}</div>
          </div>
          <div style="text-align: right;">
             <div class="label" style="font-size: 8px; color: #888; text-transform: uppercase;">Verdict</div>
             <div style="font-size: 16px; font-weight: bold; color: #c5a059;">{{ final_recommendation }}</div>
          </div>
        </div>
      </header>

      <div class="info-grid">
        <div class="info-item"><div class="label">ID</div><div class="value">#{{ application_id }}</div></div>
        <div class="info-item"><div class="label">Date</div><div class="value">{{ report_date }}</div></div>
        <div class="info-item"><div class="label">Assessment</div><div class="value">{{ assessment_score }}/100</div></div>
        <div class="info-item"><div class="label">Accuracy</div><div class="value">{{ accuracy_percent }}%</div></div>
      </div>

      <div class="executive-summary">
        <div class="score-card" style="flex: 1.5;">
          <div class="label">Maturity Index</div>
          <div class="maturity-band">{{ dl_maturity_band }}</div>
          <p style="color: #4a4a4a; margin: 0;">{{ candidate_summary[:350] }}...</p>
        </div>
        <div class="score-card" style="text-align: center; max-width: 120px;">
          <div class="label">DL Score</div>
          <div class="overall-score">{{ dl_overall_score }}</div>
          <div style="font-size: 8px; color: #888;">Authenticated</div>
        </div>
      </div>

      <div class="dl-scores-grid">
        {% for key, score in dl_scores.items() %}
        <div class="dl-stat"><div class="value">{{ score }}</div><div class="label">{{ key.replace("_", " ").title() }}</div></div>
        {% endfor %}
      </div>

      <h2>Performance Analytics</h2>
      <div class="grid-2">
        <div class="section-card">
          <h3>Assessment Profile</h3>
          <div class="chart-container"><img src="data:image/png;base64,{{ charts.section_scores }}" style="max-height: 180px;" /></div>
        </div>
        <div class="section-card">
          <h3>Efficiency & Accuracy</h3>
          <div class="chart-container"><img src="data:image/png;base64,{{ charts.accuracy }}" style="max-height: 180px;" /></div>
        </div>
      </div>
      
      <div class="section-card">
        <h3>Technical Observations</h3>
        <p style="margin: 0;">Candidate completed the assessment in <strong>{{ assessment_duration_minutes }} minutes</strong> with <strong>{{ assessment_violation_count }}</strong> integrity violations.</p>
      </div>

      <div class="footer">Generated by HireMintora AI Platform • Confidential</div>
    </div>

    <!-- Page 2: Conversational & Insights -->
    <div class="page">
      <h2>Conversational Intelligence</h2>
      <div class="grid-2">
        <div class="section-card">
          <h3>Skill Competency</h3>
          <div class="chart-container"><img src="data:image/png;base64,{{ charts.skill_ratings }}" style="max-height: 200px;" /></div>
        </div>
        <div class="section-card">
          <h3>Topic Coverage</h3>
          <div class="chart-container"><img src="data:image/png;base64,{{ charts.topic_coverage }}" style="max-height: 200px;" /></div>
        </div>
      </div>

      <div class="section-card">
        <h3>Interview Narrative</h3>
        <p style="margin: 0;">{{ interview_summary[:500] }}...</p>
      </div>

      <div class="grid-2">
        <div class="section-card" style="border-top: 3px solid #28a745;">
          <h3>Key Strengths</h3>
          <ul>{% for item in strengths[:5] %}<li>{{ item }}</li>{% endfor %}</ul>
        </div>
        <div class="section-card" style="border-top: 3px solid #c5a059;">
          <h3>Growth Areas</h3>
          <ul>{% for item in weaknesses[:5] %}<li>{{ item }}</li>{% endfor %}</ul>
        </div>
      </div>

      <div class="section-card">
        <h3>Authenticity Profile</h3>
        <div style="display: flex; gap: 20px; align-items: center;">
           <div style="text-align: center; border-right: 1px solid #eee; padding-right: 20px;">
             <div class="label" style="font-size: 8px;">Authenticity</div>
             <div style="font-size: 28px; font-weight: bold; color: #c5a059;">{{ dl_authenticity_score }}%</div>
           </div>
           <div style="flex: 1;">
             <table style="width: 100%; font-size: 10px;">
                <tr><td style="color: #666;">Interview Context</td><td style="text-align: right; font-weight: bold;">{{ dl_modality.text }}%</td></tr>
                <tr><td style="color: #666;">Proctoring Metrics</td><td style="text-align: right; font-weight: bold;">{{ dl_modality.behavioral }}%</td></tr>
                <tr><td style="color: #666;">Task Execution</td><td style="text-align: right; font-weight: bold;">{{ dl_modality.task }}%</td></tr>
             </table>
           </div>
        </div>
      </div>

      <div class="recommendation-banner" style="margin-top: 15px;">
        <div class="label" style="font-size: 9px; margin-bottom: 5px; color: #c5a059;">Final Executive Recommendation</div>
        <div class="value">{{ final_recommendation }}</div>
      </div>
      
      <div class="footer">Generated by HireMintora AI Platform • Confidential</div>
    </div>
  </body>
</html>
"""
)


def _fig_to_base64() -> str:
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight", dpi=180)
    plt.close()
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _build_bar_chart(labels: List[str], values: List[float], title: str) -> str:
    plt.figure(figsize=(6.0, 2.8))
    plt.bar(labels, values, color=["#c5a059", "#e7d7be", "#1a1a1a"])
    plt.title(title, pad=10, fontsize=9, fontweight="bold")
    plt.ylim(0, max(max(values, default=1), 100))
    plt.gca().spines["top"].set_visible(False)
    plt.gca().spines["right"].set_visible(False)
    plt.grid(axis="y", linestyle="--", alpha=0.3)
    return _fig_to_base64()


def _build_pie_chart(values: List[float], labels: List[str], title: str) -> str:
    plt.figure(figsize=(4.5, 3.5))
    plt.pie(values, labels=labels, autopct="%1.1f%%", colors=["#c5a059", "#1a1a1a", "#e7d7be"], startangle=140)
    plt.title(title, pad=10, fontsize=9, fontweight="bold")
    return _fig_to_base64()


def _build_timeline_chart(labels: List[str], values: List[float], title: str) -> str:
    plt.figure(figsize=(6.0, 2.8))
    plt.plot(labels, values, marker="o", color="#c5a059", linewidth=2, markersize=6)
    plt.fill_between(labels, values, color="#c5a059", alpha=0.1)
    plt.title(title, pad=10, fontsize=9, fontweight="bold")
    plt.gca().spines["top"].set_visible(False)
    plt.gca().spines["right"].set_visible(False)
    plt.grid(axis="y", linestyle="--", alpha=0.3)
    return _fig_to_base64()


def _safe_json_load(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)


def _generate_llm_summary(context: Dict[str, Any]) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return {
            "candidate_summary": "Assessment and interview data were consolidated into an evaluation report.",
            "interview_summary": "Interview data captured from the AI session and transcript.",
            "strengths": ["Demonstrated progression through the evaluation stages."],
            "weaknesses": ["Further manual review recommended for nuanced judgment."],
            "behavioral_observations": ["See transcript and analytics for detailed evidence."],
            "final_recommendation": "Neutral",
        }

    prompt = f"""
Return valid JSON only with keys:
candidate_summary, interview_summary, strengths, weaknesses, behavioral_observations, final_recommendation.

Context:
{json.dumps(context, default=str, indent=2)}
"""
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert hiring analyst. Return valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    result = _safe_json_load(response.choices[0].message.content.strip())
    
    # Ensure all list fields are actually lists to prevent character-per-row bug
    for field in ["strengths", "weaknesses", "behavioral_observations"]:
        if field in result and isinstance(result[field], str):
            result[field] = [result[field]]
        elif field not in result:
            result[field] = []
            
    return result


def _build_report_context(
    db: Session,
    application_id: int,
    stored_llm_summary: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise ValueError("Application not found")

    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    assessment_data = dict(application.assessment_data or {})
    interview_feedback = dict(application.interview_feedback or {})
    transcript = list(application.interview_transcript or [])

    mcq_score = float(assessment.mcq_score or 0) if assessment else 0.0
    coding_score = float(assessment.dsa_score or 0) if assessment else 0.0
    total_score = float(application.assessment_score or 0)
    correct_answers = 0
    total_mcq = 0
    if assessment:
        total_mcq = len(assessment.answers)
        correct_answers = sum(1 for answer in assessment.answers if answer.is_correct)

    accuracy_percent = round((correct_answers / total_mcq) * 100, 1) if total_mcq else 0.0
    assessment_duration_minutes = 0
    if assessment and assessment.started_at and assessment.completed_at:
        assessment_duration_minutes = max(
            1,
            int((assessment.completed_at - assessment.started_at).total_seconds() // 60),
        )

    assessment_violations = [
        violation
        for violation in assessment_data.get("violations", [])
        if violation.get("stage") == "assessment"
    ]
    interview_violations = [
        violation
        for violation in interview_feedback.get("violations", [])
        if violation.get("stage") == "interview"
    ]

    interview_duration_minutes = interview_feedback.get("duration_minutes")
    if interview_duration_minutes is None:
        started_at = interview_feedback.get("started_at")
        completed_at = interview_feedback.get("completed_at")
        if started_at and completed_at:
            start_dt = datetime.fromisoformat(started_at)
            end_dt = datetime.fromisoformat(completed_at)
            interview_duration_minutes = max(1, int((end_dt - start_dt).total_seconds() // 60))
        else:
            interview_duration_minutes = 0

    skill_ratings = interview_feedback.get(
        "skill_ratings",
        {"Communication": 70, "Technical Depth": 68, "Confidence": 65, "Problem Solving": 72},
    )
    topic_coverage = interview_feedback.get(
        "topic_coverage",
        {"Behavioral": 80, "Coding": 75, "System Design": 55},
    )

    section_times = assessment_data.get(
        "time_spent_by_section",
        {"MCQ": max(1, int(assessment_duration_minutes * 0.4)) if assessment_duration_minutes else 20,
         "Coding": max(1, int(assessment_duration_minutes * 0.6)) if assessment_duration_minutes else 40},
    )

    llm_context = {
        "candidate_name": application.user.name if application.user else "Candidate",
        "job_title": application.job.title if application.job else f"Job #{application.job_id}",
        "application_id": application.id,
        "assessment_score": total_score,
        "assessment_breakdown": {"mcq": mcq_score, "coding": coding_score, "accuracy_percent": accuracy_percent},
        "assessment_violations": assessment_violations,
        "interview_status": interview_feedback.get("ai_interview_status", "completed"),
        "interview_summary_source": interview_feedback,
        "transcript_excerpt": transcript[:12],
    }
    # ===== DL SCORING INTEGRATION =====
# Run all 3 DL models on the transcript + violations + assessment score
    dl_result = None
    try:
        pipeline = get_dl_pipeline()
        assessment_violations = assessment_data.get("violations", [])
        interview_violations = interview_feedback.get("violations", [])
        
        # Use cached DL scores if already computed, otherwise run now
        if application.dl_scores:
            dl_result = application.dl_scores
        else:
            dl_result = pipeline.score_candidate(
                interview_transcript=transcript,
                assessment_violations=assessment_violations,
                interview_violations=interview_violations,
                assessment_score=total_score,
                target_role=application.job.title if application.job else "General",
            )
            # Cache the result
            application.dl_scores = dl_result
            db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"DL scoring failed in report: {e}")
        dl_result = None
    llm_summary = stored_llm_summary or _generate_llm_summary(llm_context)

    charts = {
        "section_scores": _build_bar_chart(["MCQ", "Coding", "Total"], [mcq_score, coding_score, total_score], "Assessment Section Scores"),
        "accuracy": _build_pie_chart(
            [correct_answers, max(total_mcq - correct_answers, 0)] if total_mcq else [1],
            ["Correct", "Incorrect"] if total_mcq else ["No MCQ Data"],
            "Assessment Accuracy",
        ),
        "timeline": _build_timeline_chart(list(section_times.keys()), list(section_times.values()), "Time Spent Per Section"),
        "skill_ratings": _build_bar_chart(list(skill_ratings.keys()), list(skill_ratings.values()), "AI Interview Skill Ratings"),
        "topic_coverage": _build_bar_chart(list(topic_coverage.keys()), list(topic_coverage.values()), "Interview Topic Coverage"),
    }

    return {
        "application": application,
        "assessment": assessment,
        "assessment_data": assessment_data,
        "interview_feedback": interview_feedback,
        "interview_transcript": transcript,
        "charts": charts,
        "chart_metadata": {
            "section_scores": ["MCQ", "Coding", "Total"],
            "skill_ratings": skill_ratings,
            "topic_coverage": topic_coverage,
        },
        "llm_summary": llm_summary,
        "render_context": {
            "candidate_name": application.user.name if application.user else "Candidate",
            "job_title": application.job.title if application.job else f"Job #{application.job_id}",
            "application_id": application.id,
            "report_date": datetime.utcnow().strftime('%B %d, %Y'),
            "assessment_score": round(total_score, 1),
            "interview_summary": llm_summary.get("interview_summary", "Interview summary unavailable."),
            "candidate_summary": llm_summary.get("candidate_summary", "Candidate summary unavailable."),
            "final_recommendation": llm_summary.get("final_recommendation", "Neutral"),
            "accuracy_percent": accuracy_percent,
            "assessment_duration_minutes": assessment_duration_minutes,
            "assessment_violation_count": len(assessment_violations),
            "assessment_violations": assessment_violations[:8],
            "interview_duration_minutes": interview_duration_minutes,
            "response_count": len([item for item in transcript if item.get("speaker") == "candidate"]),
            "ai_interview_status": interview_feedback.get("ai_interview_status", "completed"),
            "interview_violation_count": len(interview_violations),
            "strengths": llm_summary.get("strengths", []),
            "weaknesses": llm_summary.get("weaknesses", []),
            "behavioral_observations": llm_summary.get("behavioral_observations", []),
            "charts": charts,
            "dl_scores":              dl_result.get("dl_scores", {}) if dl_result else {},
            "dl_maturity_band":       dl_result.get("maturity_band", "N/A") if dl_result else "N/A",
            "dl_overall_score":       dl_result.get("overall_dl_score", 0) if dl_result else 0,
            "dl_authenticity_score":  dl_result.get("authenticity_score", 0) if dl_result else 0,
            "dl_modality":            dl_result.get("modality_contributions", {}) if dl_result else {},
            "dl_model_used":          dl_result.get("model_used", "unavailable") if dl_result else "unavailable",
        },
    }


def build_report_response_payload(db: Session, report: CandidateReport) -> Dict[str, Any]:
    context = _build_report_context(
        db,
        report.application_id,
        stored_llm_summary=dict(report.llm_summary_json or {}) or None,
    )
    application = context["application"]
    assessment_data = context["assessment_data"]
    interview_feedback = context["interview_feedback"]
    llm_summary = context["llm_summary"]
    render_context = context["render_context"]
    chart_metadata = dict(report.chart_metadata_json or {})

    section_scores = {
        "MCQ": round(float(context["assessment"].mcq_score or 0), 1) if context["assessment"] else 0.0,
        "Coding": round(float(context["assessment"].dsa_score or 0), 1) if context["assessment"] else 0.0,
        "Total": round(float(application.assessment_score or 0), 1),
    }
    time_spent_by_section = {
        key: float(value)
        for key, value in (
            assessment_data.get("time_spent_by_section")
            or {
                "MCQ": max(1, int(render_context["assessment_duration_minutes"] * 0.4))
                if render_context["assessment_duration_minutes"]
                else 20,
                "Coding": max(1, int(render_context["assessment_duration_minutes"] * 0.6))
                if render_context["assessment_duration_minutes"]
                else 40,
            }
        ).items()
    }

    return {
        "id": report.id,
        "application_id": report.application_id,
        "report_type": report.report_type,
        "status": report.status,
        "pdf_path": report.pdf_path,
        "pdf_url": report.pdf_url,
        "llm_summary_json": report.llm_summary_json,
        "chart_metadata_json": chart_metadata,
        "generated_at": report.generated_at,
        "error_message": report.error_message,
        "created_at": report.created_at,
        "subject": {
            "candidate_name": application.user.name if application.user else "Candidate",
            "candidate_id": application.candidate_id,
            "job_title": application.job.title if application.job else f"Job #{application.job_id}",
            "job_id": application.job_id,
            "application_status": application.status,
        },
        "assessment": {
            "score": round(float(application.assessment_score or 0), 1),
            "accuracy_percent": render_context["accuracy_percent"],
            "duration_minutes": render_context["assessment_duration_minutes"],
            "violation_count": render_context["assessment_violation_count"],
            "violations": render_context["assessment_violations"],
            "section_scores": section_scores,
            "time_spent_by_section": time_spent_by_section,
        },
        "interview": {
            "score": round(float(application.interview_score or 0), 1),
            "duration_minutes": int(render_context["interview_duration_minutes"] or 0),
            "status": str(render_context["ai_interview_status"]),
            "violation_count": render_context["interview_violation_count"],
            "violations": [
                violation
                for violation in interview_feedback.get("violations", [])
                if violation.get("stage") == "interview"
            ],
            "response_count": int(render_context["response_count"]),
            "skill_ratings": {
                key: float(value)
                for key, value in (
                    interview_feedback.get("skill_ratings")
                    or chart_metadata.get("skill_ratings")
                    or {}
                ).items()
            },
            "topic_coverage": {
                key: float(value)
                for key, value in (
                    interview_feedback.get("topic_coverage")
                    or chart_metadata.get("topic_coverage")
                    or {}
                ).items()
            },
            "summary": render_context["interview_summary"],
        },
        "strengths": list(llm_summary.get("strengths", [])),
        "weaknesses": list(llm_summary.get("weaknesses", [])),
        "behavioral_observations": list(llm_summary.get("behavioral_observations", [])),
        "final_recommendation": llm_summary.get("final_recommendation"),
        "candidate_summary": llm_summary.get("candidate_summary"),
        "interview_summary": llm_summary.get("interview_summary"),
        "chart_images": context["charts"],
    }


def generate_candidate_report(db: Session, application_id: int) -> CandidateReport:
    from weasyprint import HTML

    report = db.query(CandidateReport).filter(CandidateReport.application_id == application_id).first()
    if not report:
        report = CandidateReport(application_id=application_id, status="pending")
        db.add(report)
        db.commit()
        db.refresh(report)

    report.status = "generating"
    report.error_message = None
    db.commit()

    context = _build_report_context(db, application_id)
    application = context["application"]
    report_dir = REPORTS_DIR / f"application_{application_id}"
    report_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = report_dir / "candidate_evaluation_report.pdf"

    html = REPORT_TEMPLATE.render(**context["render_context"])
    HTML(string=html, base_url=str(report_dir.resolve())).write_pdf(str(pdf_path))

    report.status = "completed"
    report.pdf_path = str(pdf_path.resolve())
    report.pdf_url = f"/v1/reports/{report.id}/download" if report.id else None
    report.llm_summary_json = context["llm_summary"]
    report.chart_metadata_json = context["chart_metadata"]
    report.generated_at = datetime.utcnow()

    application.interview_feedback = dict(application.interview_feedback or {})
    application.interview_feedback["report_generated_at"] = report.generated_at.isoformat()

    db.commit()
    db.refresh(report)
    return report


def generate_candidate_report_safe(application_id: int) -> None:
    db = SessionLocal()
    try:
        generate_candidate_report(db, application_id)
    except Exception as error:
        report = db.query(CandidateReport).filter(CandidateReport.application_id == application_id).first()
        if report:
            report.status = "failed"
            report.error_message = str(error)
            db.commit()
    finally:
        db.close()


async def generate_candidate_report_background(application_id: int) -> None:
    await asyncio.to_thread(generate_candidate_report_safe, application_id)
