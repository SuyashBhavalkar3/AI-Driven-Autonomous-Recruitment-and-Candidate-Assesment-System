#!/usr/bin/env python3
"""
Test script for the improved AI resume matching service
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from applications.ai_service import analyze_resume_match

async def test_ai_service():
    """Test the AI service with sample data"""
    
    print("Testing AI Resume Matching Service\n")
    
    # Sample job description
    job_description = {
        "title": "Senior Python Developer",
        "description": "We are looking for a senior Python developer with experience in web development",
        "required_skills": ["Python", "Django", "PostgreSQL", "REST API", "Git"],
        "experience_required": 3
    }
    
    # Test Case 1: Strong match candidate
    print("=" * 50)
    print("TEST CASE 1: Strong Match Candidate")
    print("=" * 50)
    
    strong_candidate_data = {
        "skills": ["Python", "Django", "PostgreSQL", "REST API", "Git", "Docker", "AWS"],
        "experience": [
            {
                "position": "Senior Python Developer",
                "company": "Tech Corp",
                "description": "Developed web applications using Django and PostgreSQL"
            },
            {
                "position": "Python Developer", 
                "company": "StartupXYZ",
                "description": "Built REST APIs and worked with Git for version control"
            },
            {
                "position": "Junior Developer",
                "company": "CodeCorp",
                "description": "Started career in Python development"
            }
        ]
    }
    
    result1 = await analyze_resume_match(strong_candidate_data, job_description)
    print(f"Score: {result1['match_score']}%")
    print(f"Reasoning: {result1['reasoning']}")
    print(f"Matched Skills: {result1['skills_matched']}")
    print(f"Missing Skills: {result1['skills_missing']}")
    print()
    
    # Test Case 2: Partial match candidate
    print("=" * 50)
    print("TEST CASE 2: Partial Match Candidate")
    print("=" * 50)
    
    partial_candidate_data = {
        "skills": ["Python", "Flask", "MySQL", "JavaScript"],
        "experience": [
            {
                "position": "Web Developer",
                "company": "WebCorp", 
                "description": "Worked with Python and Flask to build web applications"
            }
        ]
    }
    
    result2 = await analyze_resume_match(partial_candidate_data, job_description)
    print(f"Score: {result2['match_score']}%")
    print(f"Reasoning: {result2['reasoning']}")
    print(f"Matched Skills: {result2['skills_matched']}")
    print(f"Missing Skills: {result2['skills_missing']}")
    print()
    
    # Test Case 3: Weak match candidate
    print("=" * 50)
    print("TEST CASE 3: Weak Match Candidate")
    print("=" * 50)
    
    weak_candidate_data = {
        "skills": ["Java", "Spring", "Oracle", "Maven"],
        "experience": [
            {
                "position": "Java Developer",
                "company": "JavaCorp",
                "description": "Developed enterprise applications using Java and Spring"
            }
        ]
    }
    
    result3 = await analyze_resume_match(weak_candidate_data, job_description)
    print(f"Score: {result3['match_score']}%")
    print(f"Reasoning: {result3['reasoning']}")
    print(f"Matched Skills: {result3['skills_matched']}")
    print(f"Missing Skills: {result3['skills_missing']}")
    print()
    
    # Test Case 4: Empty candidate data
    print("=" * 50)
    print("TEST CASE 4: Empty Candidate Data")
    print("=" * 50)
    
    result4 = await analyze_resume_match({}, job_description)
    print(f"Score: {result4['match_score']}%")
    print(f"Reasoning: {result4['reasoning']}")
    print()
    
    print("All tests completed!")

if __name__ == "__main__":
    asyncio.run(test_ai_service())