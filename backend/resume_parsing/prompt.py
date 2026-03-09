PARSING_PROMPT = f"""
Extract structured JSON from the resume below.

Return ONLY valid JSON.
No explanation.
No markdown.

Structure:

{{
"name": "",
"email": "",
"phone": "",
"education": {{
    "degree": "",
    "institution": "",
    "graduation_date": "",
    "location": ""
}},
"experience": {{
    "company_name": "",
    "title": "",
    "start_date": "",
    "end_date": "",
    "location": "",
    "responsibilities": ""
}},
"skills": {{
    "languages": "",
    "backend_technologies": "",
    "databases": "",
    "ai_ml_frameworks": "",
    "tools_platforms": "",
    "core_competencies": ""
}},
"projects": [
    {{
        "project_name": "",
        "description": "",
        "github_url": ""
    }}
],
"certifications": "",
"leadership_extracurricular": "",
"github_profile_url": "",
"linkedin_url": ""
}}

Resume: 
"""