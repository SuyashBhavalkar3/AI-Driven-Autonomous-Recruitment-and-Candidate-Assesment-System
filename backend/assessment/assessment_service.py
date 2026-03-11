import openai
import os
import json
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
logger = logging.getLogger(__name__)


ASSESSMENT_PROMPT_TEMPLATE = """
You are an expert technical recruiter and assessment designer. Your task is to generate 25 multiple choice technical questions based on a candidate's resume and job requirements.

IMPORTANT: Generate questions in valid JSON format ONLY. Do not include any text outside the JSON structure.

Resume Skills and Experience:
{resume_summary}

Job Requirements:
- Title: {job_title}
- Required Skills: {required_skills}
- Experience Required: {experience_required} years
- Job Description: {job_description}

Generate 25 MCQ technical questions that:
1. Are relevant to the candidate's background and job requirements
2. Test core competencies needed for the role
3. Have clear, unambiguous answers
4. Cover different difficulty levels (easy, medium, hard)
5. Match the candidate's skill set

For each question, provide:
- question_text: The actual question
- option_a: First option
- option_b: Second option
- option_c: Third option
- option_d: Fourth option
- correct_option: The correct answer (A, B, C, or D)
- topic: What area of knowledge this tests (e.g., "Python", "Database Design", "System Architecture")
- difficulty: easy, medium, or hard
- explanation: Brief explanation of why the correct answer is right (optional but helpful for candidates)

Return the response as a valid JSON array with the structure:
[
  {{
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "A",
    "topic": "...",
    "difficulty": "medium",
    "explanation": "..."
  }},
  ...
]

Important: Return ONLY valid JSON. No additional text, no markdown code blocks, just the JSON array.
"""


async def generate_assessment_questions(
    parsed_resume: Dict[str, Any],
    job_data: Dict[str, Any],
    num_questions: int = 8
) -> List[Dict[str, Any]]:
    """
    Generate MCQ assessment questions based on candidate resume and job requirements.
    
    Args:
        parsed_resume: Candidate's parsed resume data
        job_data: Job description and requirements
        num_questions: Number of questions to generate (default: 8)
    
    Returns:
        List of generated questions with all required fields
    """
    
    try:
        # Prepare resume summary
        resume_summary = format_resume_for_prompt(parsed_resume)
        
        prompt = ASSESSMENT_PROMPT_TEMPLATE.format(
            resume_summary=resume_summary,
            job_title=job_data.get('title', 'Unknown'),
            required_skills=json.dumps(job_data.get('required_skills', [])),
            experience_required=job_data.get('experience_required', 0),
            job_description=job_data.get('description', '')[:1000]  # Limit length
        )
        
        logger.info(f"Generating {num_questions} assessment questions using GPT")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert technical assessment designer. Return only valid JSON arrays, no additional text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        # Parse the response
        response_text = response.choices[0].message.content.strip()
        
        # Clean up response if it contains markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]  # Remove ```json
        if response_text.startswith("```"):
            response_text = response_text[3:]  # Remove ```
        if response_text.endswith("```"):
            response_text = response_text[:-3]  # Remove trailing ```
        
        response_text = response_text.strip()
        
        questions = json.loads(response_text)
        
        # Ensure we have the right number of questions
        questions = questions[:num_questions]
        
        # Validate and clean each question
        validated_questions = []
        for q in questions:
            if validate_question(q):
                validated_questions.append(q)
        
        logger.info(f"Successfully generated {len(validated_questions)} assessment questions")
        return validated_questions
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Error generating assessment questions: {str(e)}")
        return []


def format_resume_for_prompt(parsed_resume: Dict[str, Any]) -> str:
    """
    Format parsed resume data into a readable prompt format.
    Handles both old parsed_data format and new structured candidate profile data.
    
    Args:
        parsed_resume: Resume data (either parsed JSON or compiled from profile tables)
    
    Returns:
        Formatted string for the prompt
    """
    
    summary_parts = []
    
    # Skills - handle both old format (list) and new format (dict with categories)
    if parsed_resume.get('skills'):
        skills = parsed_resume['skills']
        if isinstance(skills, list):
            summary_parts.append(f"Skills: {', '.join(skills[:15])}")
        elif isinstance(skills, dict):
            # New structured format
            skill_list = []
            if skills.get('languages'):
                skill_list.append(f"Languages: {skills['languages']}")
            if skills.get('backend_technologies'):
                skill_list.append(f"Backend: {skills['backend_technologies']}")
            if skills.get('databases'):
                skill_list.append(f"Databases: {skills['databases']}")
            if skills.get('ai_ml_frameworks'):
                skill_list.append(f"AI/ML: {skills['ai_ml_frameworks']}")
            if skills.get('tools_platforms'):
                skill_list.append(f"Tools: {skills['tools_platforms']}")
            if skills.get('core_competencies'):
                skill_list.append(f"Core Competencies: {skills['core_competencies']}")
            if skill_list:
                summary_parts.append("Skills:\n  - " + "\n  - ".join(skill_list))
    
    # Experience summary
    if parsed_resume.get('experiences'):
        experiences = parsed_resume['experiences']
        if isinstance(experiences, list) and len(experiences) > 0:
            summary_parts.append(f"Total Experiences: {len(experiences)}")
            
            # Add current/most recent role
            current_exp = None
            for exp in experiences:
                if isinstance(exp, dict) and exp.get('is_current'):
                    current_exp = exp
                    break
            
            if not current_exp and len(experiences) > 0:
                current_exp = experiences[0]
            
            if isinstance(current_exp, dict):
                job_title = current_exp.get('job_title', 'N/A')
                company = current_exp.get('company_name', 'N/A')
                exp_text = f"Current/Most Recent: {job_title} at {company}"
                if current_exp.get('description'):
                    exp_text += f" - {current_exp['description'][:100]}"
                summary_parts.append(exp_text)
    
    # Education
    if parsed_resume.get('education'):
        education = parsed_resume['education']
        if isinstance(education, list) and len(education) > 0:
            edu_list = []
            for edu in education[:3]:  # Show top 3 education records
                if isinstance(edu, dict):
                    degree = edu.get('degree', '')
                    field = edu.get('field_of_study', '')
                    institution = edu.get('institution', '')
                    edu_text = f"{degree}"
                    if field:
                        edu_text += f" in {field}"
                    if institution:
                        edu_text += f" from {institution}"
                    if edu_text:
                        edu_list.append(edu_text)
            if edu_list:
                summary_parts.append("Education:\n  - " + "\n  - ".join(edu_list))
    
    # Projects
    if parsed_resume.get('projects'):
        projects = parsed_resume['projects']
        if isinstance(projects, list) and len(projects) > 0:
            summary_parts.append(f"Projects: {len(projects)} projects")
            # Add first 2 project names
            for proj in projects[:2]:
                if isinstance(proj, dict) and proj.get('project_name'):
                    summary_parts.append(f"  - {proj['project_name']}")
    
    # Certifications
    if parsed_resume.get('certifications'):
        certs = parsed_resume['certifications']
        if isinstance(certs, list) and len(certs) > 0:
            cert_titles = []
            for cert in certs[:5]:
                if isinstance(cert, dict) and cert.get('title'):
                    cert_titles.append(cert['title'])
                elif isinstance(cert, str):
                    cert_titles.append(cert)
            if cert_titles:
                summary_parts.append(f"Certifications: {', '.join(cert_titles)}")
    
    return "\n".join(summary_parts)


def validate_question(question: Dict[str, Any]) -> bool:
    """
    Validate that a question has all required fields.
    
    Args:
        question: Question dict to validate
    
    Returns:
        True if valid, False otherwise
    """
    
    required_fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']
    
    # Check all required fields exist
    for field in required_fields:
        if field not in question or not question[field]:
            logger.warning(f"Question missing field: {field}")
            return False
    
    # Validate correct_option is one of A, B, C, D
    if question['correct_option'] not in ['A', 'B', 'C', 'D']:
        logger.warning(f"Invalid correct_option: {question['correct_option']}")
        return False
    
    return True


async def evaluate_assessment_answers(
    questions_with_answers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluate assessment answers and calculate score.
    
    Args:
        questions_with_answers: List of questions with candidate answers
    
    Returns:
        Score dictionary with metrics
    """
    
    total = len(questions_with_answers)
    correct = 0
    
    for item in questions_with_answers:
        if item.get('selected_option') == item.get('correct_option'):
            correct += 1
    
    percentage = (correct / total * 100) if total > 0 else 0
    score = int(correct * 10)  # Each question worth 10 points for 10 questions
    
    return {
        "score": score,
        "total_questions": total,
        "correct_answers": correct,
        "questions_answered": len([q for q in questions_with_answers if q.get('selected_option')]),
        "percentage": round(percentage, 2),
        "passed": percentage >= 60  # 60% passing threshold
    }
