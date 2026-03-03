def build_system_prompt(job_data: dict):
    return f"""
    You are an AI interviewer.

    Role: {job_data['title']}
    Skills: {job_data['required_skills']}
    Experience: {job_data['experience_required']} years

    Interview Flow:
    {job_data['interview_config']}
    """