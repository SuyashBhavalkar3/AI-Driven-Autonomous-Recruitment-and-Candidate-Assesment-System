import openai
import os
from typing import Dict, Any

openai.api_key = os.getenv("OPENAI_API_KEY")

async def analyze_resume_match(parsed_resume: Dict[str, Any], job_description: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze resume against job requirements using AI"""
    
    prompt = f"""
    Analyze the candidate's resume against the job requirements and provide a detailed match score.
    
    Job Requirements:
    - Title: {job_description.get('title')}
    - Required Skills: {job_description.get('required_skills', [])}
    - Experience Required: {job_description.get('experience_required', 0)} years
    - Description: {job_description.get('description', '')}
    
    Candidate Resume:
    {parsed_resume}
    
    Provide a JSON response with:
    1. match_score (0-100)
    2. skills_match (list of matched skills)
    3. skills_gap (list of missing skills)
    4. experience_match (boolean)
    5. strengths (list of candidate strengths)
    6. concerns (list of potential concerns)
    7. recommendation (proceed/reject with reason)
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter analyzing candidate resumes."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        return {
            "match_score": 0,
            "error": str(e),
            "recommendation": "reject"
        }
