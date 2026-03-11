import os
import json
from dotenv import load_dotenv

# Load environment variables first
load_dotenv(override=True)

from groq import Groq
from pdfminer.high_level import extract_text as extract_pdf_text
from docx import Document
from resume_parsing.prompt import PARSING_PROMPT

# Load Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print(f"[DEBUG] Groq API Key: {GROQ_API_KEY}")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

client = Groq(api_key=GROQ_API_KEY)


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
    try:
        text = extract_text(file,file_path)
        print(f"[DEBUG] Extracted text length: {len(text)}")
        result = parse_resume_with_groq(text)
        print(f"[DEBUG] Parse result: {result}")
        return result
    except Exception as e:
        print(f"[ERROR] parse_resume failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

from sqlalchemy.orm import Session
from candidate_profile.models import Skill, Education, Experience, Project

def save_parsed_data(db: Session, candidate_id: int, parsed_data: dict):
    """
    Takes parsed JSON from LLM and saves each section
    into its respective table linked to the candidate.
    """
    try:
        # --- Education (can be single or list) ---
        edu_data = parsed_data.get("education", [])
        if isinstance(edu_data, dict):
            edu_data = [edu_data]
        
        for edu in edu_data:
            if edu and any(edu.values()):
                db.add(Education(
                    candidate_id=candidate_id,
                    institution=edu.get("institution", ""),
                    degree=edu.get("degree", ""),
                    field_of_study=edu.get("field_of_study"),
                    start_date=edu.get("start_date", ""),
                    end_date=edu.get("end_date"),
                    grade=edu.get("grade"),
                ))

        # --- Experience (can be single or list) ---
        exp_data = parsed_data.get("experience", [])
        if isinstance(exp_data, dict):
            exp_data = [exp_data]
        
        for exp in exp_data:
            if exp and any(exp.values()):
                db.add(Experience(
                    candidate_id=candidate_id,
                    company_name=exp.get("company_name", ""),
                    job_title=exp.get("job_title", ""),
                    location=exp.get("location"),
                    start_date=exp.get("start_date", ""),
                    end_date=exp.get("end_date"),
                    is_current=exp.get("is_current", False),
                    description=exp.get("description"),
                ))

        # --- Projects (list) ---
        for proj in parsed_data.get("projects", []):
            if proj.get("project_name"):
                db.add(Project(
                    candidate_id=candidate_id,
                    project_name=proj.get("project_name", ""),
                    description=proj.get("description"),
                    github_url=proj.get("github_url"),
                ))

        # --- Skills (list of skill objects) ---
        skills_data = parsed_data.get("skills", [])
        if isinstance(skills_data, list):
            for skill in skills_data:
                if isinstance(skill, dict) and skill.get("skill_name"):
                    db.add(Skill(
                        candidate_id=candidate_id,
                        skill_name=skill.get("skill_name", ""),
                        proficiency=skill.get("proficiency"),
                    ))

        db.commit()
        print(f"[DEBUG] Successfully saved parsed data for candidate {candidate_id}")
    except Exception as e:
        print(f"[ERROR] save_parsed_data failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise