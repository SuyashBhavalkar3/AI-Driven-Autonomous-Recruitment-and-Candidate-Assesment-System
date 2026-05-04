import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from authentication.database import SessionLocal, init_db
from authentication.models import User
from resume_parsing.models import Candidate
from candidate_profile.models import Experience, Education, Skill, Project
from job_management_module.models import Job
from candidate_profile.schemas import CandidateProfileComplete, ExperienceCreate, EducationCreate, SkillCreate
import json

def test_save_profile():
    db = SessionLocal()
    try:
        # Get a test user
        user = db.query(User).first()
        if not user:
            print("No user found in database")
            return

        print(f"Testing save_profile for user: {user.email}")
        
        # Simulate form data
        phone = "1234567890"
        linkedin_url = "https://linkedin.com/in/test"
        github_url = "https://github.com/test"
        bio = "Test bio"
        experiences_json = json.dumps([{"company_name": "Test Co", "job_title": "Dev", "start_date": "2020", "is_current": True}])
        education_json = json.dumps([{"institution": "Test Uni", "degree": "BS", "start_date": "2016"}])
        skills_json = json.dumps([{"languages": "Python, JS"}])

        # Logic from routes.py
        experiences = json.loads(experiences_json)
        education = json.loads(education_json)
        skills = json.loads(skills_json)
        
        profile_data = CandidateProfileComplete(
            phone=phone,
            linkedin_url=linkedin_url,
            github_url=github_url,
            bio=bio,
            experiences=experiences,
            education=education,
            skills=skills
        )
        
        candidate = db.query(Candidate).filter(Candidate.user_id == user.id).first()
        
        if not candidate:
            print("Creating new candidate")
            candidate = Candidate(
                user_id=user.id,
                linkedin_url=linkedin_url or "",
                resume_url="http://example.com/resume.pdf" # Mocking resume_url as it's nullable=False
            )
            db.add(candidate)
            db.flush()
        
        candidate.phone = phone
        candidate.linkedin_url = linkedin_url
        candidate.github_url = github_url
        candidate.bio = bio
        candidate.profile_completed = True
        
        print("Deleting old data")
        db.query(Experience).filter(Experience.candidate_id == candidate.id).delete()
        db.query(Education).filter(Education.candidate_id == candidate.id).delete()
        db.query(Skill).filter(Skill.candidate_id == candidate.id).delete()
        db.query(Project).filter(Project.candidate_id == candidate.id).delete()
        
        print("Adding new data")
        for exp_data in profile_data.experiences:
            experience = Experience(candidate_id=candidate.id, **exp_data.dict())
            db.add(experience)
        
        for edu_data in profile_data.education:
            education = Education(candidate_id=candidate.id, **edu_data.dict())
            db.add(education)
        
        for skill_data in profile_data.skills:
            skill = Skill(candidate_id=candidate.id, **skill_data.dict())
            db.add(skill)
            
        db.commit()
        print("Profile saved successfully in test script")
        
    except Exception as e:
        db.rollback()
        print(f"Error in test script: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_save_profile()
