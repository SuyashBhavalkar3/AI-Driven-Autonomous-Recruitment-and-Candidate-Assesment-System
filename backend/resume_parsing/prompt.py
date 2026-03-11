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
"education": [
    {{
        "degree": "",
        "institution": "",
        "field_of_study": "",
        "start_date": "",
        "end_date": "",
        "grade": ""
    }}
],
"experience": [
    {{
        "company_name": "",
        "job_title": "",
        "start_date": "",
        "end_date": "",
        "location": "",
        "description": "",
        "is_current": false
    }}
],
"skills": [
    {{
        "skill_name": "",
        "proficiency": ""
    }}
],
"projects": [
    {{
        "project_name": "",
        "description": "",
        "github_url": ""
    }}
],
"certifications": "",
"github_profile_url": "",
"linkedin_url": ""
}}

Resume: 
"""