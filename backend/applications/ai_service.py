import os
from typing import Dict, Any, List
import json
import re
from datetime import datetime

def extract_candidate_skills(candidate_data: Dict[str, Any], candidate_obj=None) -> List[str]:
    """Extract all skills from candidate data and related objects"""
    skills = set()
    
    # Extract from parsed_data JSON
    if isinstance(candidate_data, dict):
        # Common skill fields in parsed data
        skill_fields = ['skills', 'technical_skills', 'technologies', 'programming_languages', 
                       'tools', 'frameworks', 'languages', 'competencies']
        
        for field in skill_fields:
            if field in candidate_data:
                field_data = candidate_data[field]
                if isinstance(field_data, list):
                    skills.update([skill.lower().strip() for skill in field_data if skill])
                elif isinstance(field_data, str):
                    # Split by common delimiters
                    skill_list = re.split(r'[,;|\n]', field_data)
                    skills.update([skill.lower().strip() for skill in skill_list if skill.strip()])
    
    # Extract from structured Skills table if candidate object is provided
    if candidate_obj and hasattr(candidate_obj, 'skills'):
        for skill_record in candidate_obj.skills:
            skill_fields = ['languages', 'backend_technologies', 'databases', 
                          'ai_ml_frameworks', 'tools_platforms', 'core_competencies']
            for field in skill_fields:
                field_value = getattr(skill_record, field, None)
                if field_value:
                    skill_list = re.split(r'[,;|\n]', field_value)
                    skills.update([skill.lower().strip() for skill in skill_list if skill.strip()])
    
    return list(skills)

def extract_candidate_experience(candidate_data: Dict[str, Any], candidate_obj=None) -> Dict[str, Any]:
    """Extract experience information from candidate data"""
    experience_info = {
        'years': 0,
        'positions': [],
        'companies': [],
        'descriptions': []
    }
    
    # Extract from parsed_data JSON
    if isinstance(candidate_data, dict):
        exp_fields = ['experience', 'work_experience', 'experiences', 'employment', 'jobs']
        for field in exp_fields:
            if field in candidate_data:
                exp_data = candidate_data[field]
                if isinstance(exp_data, list):
                    experience_info['years'] = max(experience_info['years'], len(exp_data))
                    for exp in exp_data:
                        if isinstance(exp, dict):
                            if 'position' in exp or 'title' in exp or 'job_title' in exp:
                                experience_info['positions'].append(
                                    exp.get('position') or exp.get('title') or exp.get('job_title', '')
                                )
                            if 'company' in exp or 'company_name' in exp:
                                experience_info['companies'].append(
                                    exp.get('company') or exp.get('company_name', '')
                                )
                            if 'description' in exp:
                                experience_info['descriptions'].append(exp.get('description', ''))
                elif isinstance(exp_data, (int, float)):
                    experience_info['years'] = max(experience_info['years'], exp_data)
    
    # Extract from structured Experience table
    if candidate_obj and hasattr(candidate_obj, 'experiences'):
        structured_exp_count = len(candidate_obj.experiences)
        experience_info['years'] = max(experience_info['years'], structured_exp_count)
        
        for exp in candidate_obj.experiences:
            if exp.job_title:
                experience_info['positions'].append(exp.job_title.lower())
            if exp.company_name:
                experience_info['companies'].append(exp.company_name.lower())
            if exp.description:
                experience_info['descriptions'].append(exp.description.lower())
    
    return experience_info

def calculate_skills_match_score(candidate_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
    """Calculate detailed skills matching score"""
    if not required_skills:
        return {'score': 40, 'matched': [], 'missing': required_skills}
    
    required_skills_lower = [skill.lower().strip() for skill in required_skills]
    matched_skills = []
    missing_skills = []
    
    for req_skill in required_skills_lower:
        skill_matched = False
        
        for candidate_skill in candidate_skills:
            # Exact match
            if req_skill == candidate_skill:
                matched_skills.append(req_skill)
                skill_matched = True
                break
            # Partial match - check if one contains the other
            elif (req_skill in candidate_skill or candidate_skill in req_skill):
                matched_skills.append(req_skill)
                skill_matched = True
                break
            # Keyword match - check if key words overlap
            elif len(req_skill) > 3:
                req_words = set(req_skill.split())
                candidate_words = set(candidate_skill.split())
                if req_words.intersection(candidate_words):
                    matched_skills.append(req_skill)
                    skill_matched = True
                    break
        
        if not skill_matched:
            missing_skills.append(req_skill)
    
    # Calculate score based on match percentage
    match_percentage = len(matched_skills) / len(required_skills) if required_skills else 0
    skills_score = int(match_percentage * 60)  # Skills worth 60% of total score
    
    return {
        'score': skills_score,
        'matched': matched_skills,
        'missing': missing_skills,
        'match_percentage': match_percentage * 100
    }

def calculate_experience_match_score(candidate_exp: Dict[str, Any], required_experience: int, job_title: str) -> Dict[str, Any]:
    """Calculate experience matching score"""
    exp_score = 0
    analysis = {'years_match': False, 'role_relevance': False, 'description_relevance': False}
    
    # Years of experience matching (15 points)
    candidate_years = candidate_exp['years']
    if required_experience <= 0:
        exp_score += 10  # Give some points if no specific requirement
        analysis['years_match'] = True
    elif candidate_years >= required_experience:
        exp_score += 15
        analysis['years_match'] = True
    elif candidate_years >= required_experience * 0.7:
        exp_score += 12
        analysis['years_match'] = True
    elif candidate_years >= required_experience * 0.5:
        exp_score += 8
    else:
        exp_score += 3  # Some credit for any experience
    
    # Role relevance (10 points)
    job_title_lower = job_title.lower()
    job_keywords = set(job_title_lower.split())
    
    for position in candidate_exp['positions']:
        position_keywords = set(position.split())
        if job_keywords.intersection(position_keywords):
            exp_score += 10
            analysis['role_relevance'] = True
            break
    
    # Description relevance (5 points)
    for desc in candidate_exp['descriptions']:
        if any(keyword in desc for keyword in job_keywords):
            exp_score += 5
            analysis['description_relevance'] = True
            break
    
    return {'score': min(30, exp_score), 'analysis': analysis}

def calculate_comprehensive_match_score(candidate_data: Dict[str, Any], job_description: Dict[str, Any], candidate_obj=None) -> Dict[str, Any]:
    """Calculate comprehensive match score with detailed analysis"""
    
    # Extract candidate information
    candidate_skills = extract_candidate_skills(candidate_data, candidate_obj)
    candidate_exp = extract_candidate_experience(candidate_data, candidate_obj)
    
    # Job requirements
    required_skills = job_description.get('required_skills', [])
    required_experience = job_description.get('experience_required', 0) or 0
    job_title = job_description.get('title', '')
    
    print(f"Detailed Analysis:")
    print(f"   Candidate skills: {candidate_skills[:10]}...")  # Show first 10
    print(f"   Required skills: {required_skills}")
    print(f"   Candidate experience: {candidate_exp['years']} years")
    print(f"   Required experience: {required_experience} years")
    
    # Calculate skills match (60% weight)
    skills_analysis = calculate_skills_match_score(candidate_skills, required_skills)
    
    # Calculate experience match (30% weight)
    experience_analysis = calculate_experience_match_score(candidate_exp, required_experience, job_title)
    
    # Profile completeness (10% weight)
    profile_score = 0
    if candidate_skills:
        profile_score += 3
    if candidate_exp['years'] > 0:
        profile_score += 3
    if candidate_exp['positions']:
        profile_score += 2
    if candidate_exp['descriptions']:
        profile_score += 2
    
    # Total score
    total_score = skills_analysis['score'] + experience_analysis['score'] + profile_score
    total_score = min(100, max(20, total_score))  # Ensure between 20-100
    
    # Generate detailed reasoning
    reasoning_parts = []
    reasoning_parts.append(f"Skills Match: {skills_analysis['match_percentage']:.1f}% ({len(skills_analysis['matched'])}/{len(required_skills)} required skills)")
    reasoning_parts.append(f"Experience: {candidate_exp['years']} years (required: {required_experience})")
    
    if skills_analysis['matched']:
        reasoning_parts.append(f"Matched skills: {', '.join(skills_analysis['matched'][:5])}")
    if skills_analysis['missing']:
        reasoning_parts.append(f"Missing skills: {', '.join(skills_analysis['missing'][:3])}")
    
    return {
        'match_score': total_score,
        'skills_analysis': skills_analysis,
        'experience_analysis': experience_analysis,
        'reasoning': '. '.join(reasoning_parts),
        'recommendation': 'strong_match' if total_score >= 70 else 'good_match' if total_score >= 50 else 'consider' if total_score >= 30 else 'weak_match'
    }

async def analyze_resume_match(candidate_data: Dict[str, Any], job_description: Dict[str, Any], candidate_obj=None) -> Dict[str, Any]:
    """Analyze resume against job requirements with comprehensive matching"""
    
    print(f"Starting comprehensive resume analysis...")
    print(f"   Job: {job_description.get('title', 'Unknown')}")
    
    try:
        # Use comprehensive matching algorithm
        result = calculate_comprehensive_match_score(candidate_data, job_description, candidate_obj)
        
        print(f"   Final score: {result['match_score']}%")
        print(f"   Recommendation: {result['recommendation']}")
        
        return {
            'match_score': result['match_score'],
            'analysis_method': 'comprehensive_matching',
            'reasoning': result['reasoning'],
            'skills_matched': result['skills_analysis']['matched'],
            'skills_missing': result['skills_analysis']['missing'],
            'recommendation': result['recommendation'],
            'detailed_analysis': {
                'skills_score': result['skills_analysis']['score'],
                'experience_score': result['experience_analysis']['score'],
                'skills_match_percentage': result['skills_analysis']['match_percentage'],
                'experience_analysis': result['experience_analysis']['analysis']
            }
        }
        
    except Exception as e:
        print(f"Error in comprehensive analysis: {e}")
        # Fallback to basic scoring
        basic_score = 25
        return {
            'match_score': basic_score,
            'analysis_method': 'fallback',
            'reasoning': f'Analysis error, using fallback score: {basic_score}%',
            'skills_matched': [],
            'skills_missing': job_description.get('required_skills', []),
            'recommendation': 'consider'
        }
