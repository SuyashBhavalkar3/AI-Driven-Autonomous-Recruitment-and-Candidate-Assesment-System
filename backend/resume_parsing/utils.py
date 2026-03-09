import os
import json
from groq import Groq
from pdfminer.high_level import extract_text as extract_pdf_text
from docx import Document
from resume_parsing.prompt import PARSING_PROMPT
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq()


def extract_text(file_stream, filename: str):
    extension = filename.split(".")[-1].lower()

    if extension == "pdf":
        # example using pdfminer
        from pdfminer.high_level import extract_text
        text = extract_text(file_stream)

    elif extension in ["doc", "docx"]:
        # handle word file
        text = "doc parsing logic"

    else:
        raise ValueError("Unsupported file format")

    return text

def parse_resume_with_groq(resume_text):
    full_prompt = f"{PARSING_PROMPT}\n\n{resume_text}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert AI resume parser that extracts structured JSON."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ],
        temperature=0
    )

    result = response.choices[0].message.content.strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON returned",
            "raw_output": result
        }
    
def parse_resume(file,file_path):
    text = extract_text(file,file_path)
    return parse_resume_with_groq(text)

from sqlalchemy.orm import Session
from resume_parsing.models import Education, Experience, Project, Skill, Certification

def save_parsed_data(db: Session, candidate_id: int, parsed_data: dict):
    """
    Takes parsed JSON from LLM and saves each section
    into its respective table linked to the candidate.
    """

    # --- Education (single object in your schema) ---
    edu = parsed_data.get("education", {})
    if edu and any(edu.values()):
        db.add(Education(
            candidate_id=candidate_id,
            degree=edu.get("degree"),
            institution=edu.get("institution"),
            graduation_date=edu.get("graduation_date"),
            location=edu.get("location"),
        ))

    # --- Experience (single object — wrap in list for flexibility) ---
    exp_data = parsed_data.get("experience", {})
    if exp_data and any(exp_data.values()):
        # Handle both single dict and list
        experiences = exp_data if isinstance(exp_data, list) else [exp_data]
        for exp in experiences:
            db.add(Experience(
                candidate_id=candidate_id,
                company_name=exp.get("company_name"),
                title=exp.get("title"),
                start_date=exp.get("start_date"),
                end_date=exp.get("end_date"),
                location=exp.get("location"),
                responsibilities=exp.get("responsibilities"),
            ))

    # --- Projects (list) ---
    for proj in parsed_data.get("projects", []):
        db.add(Project(
            candidate_id=candidate_id,
            project_name=proj.get("project_name"),
            description=proj.get("description"),
            github_url=proj.get("github_url"),
        ))

    # --- Skills (single object) ---
    skills = parsed_data.get("skills", {})
    if skills and any(skills.values()):
        db.add(Skill(
            candidate_id=candidate_id,
            languages=skills.get("languages"),
            backend_technologies=skills.get("backend_technologies"),
            databases=skills.get("databases"),
            ai_ml_frameworks=skills.get("ai_ml_frameworks"),
            tools_platforms=skills.get("tools_platforms"),
            core_competencies=skills.get("core_competencies"),
        ))

    # --- Certifications (string or list) ---
    certs = parsed_data.get("certifications", "")
    if isinstance(certs, str) and certs.strip():
        # LLM sometimes returns comma-separated string
        for cert in certs.split(","):
            cert = cert.strip()
            if cert:
                db.add(Certification(candidate_id=candidate_id, title=cert))
    elif isinstance(certs, list):
        for cert in certs:
            title = cert if isinstance(cert, str) else cert.get("title", "")
            if title:
                db.add(Certification(candidate_id=candidate_id, title=title))

    db.commit()