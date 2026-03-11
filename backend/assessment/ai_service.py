import json
import os
from typing import List, Dict, Any

# Fallback questions for when AI generation is not available
def get_default_questions():
    """Default questions if AI generation fails"""
    return {
        "questions": [
            # MCQ Questions (10)
            {
                "id": 1,
                "type": "mcq",
                "title": "Programming Fundamentals",
                "description": "What is the time complexity of binary search?",
                "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
                "correct_answer": 1,
                "points": 5,
                "category": "Algorithms"
            },
            {
                "id": 2,
                "type": "mcq", 
                "title": "Data Structures",
                "description": "Which data structure uses LIFO principle?",
                "options": ["Queue", "Stack", "Array", "Linked List"],
                "correct_answer": 1,
                "points": 5,
                "category": "Data Structures"
            },
            {
                "id": 3,
                "type": "mcq",
                "title": "Object-Oriented Programming",
                "description": "What is encapsulation in OOP?",
                "options": [
                    "Hiding implementation details",
                    "Creating multiple objects",
                    "Inheriting from parent class",
                    "Overloading methods"
                ],
                "correct_answer": 0,
                "points": 5,
                "category": "OOP"
            },
            {
                "id": 4,
                "type": "mcq",
                "title": "Database Concepts",
                "description": "What does SQL stand for?",
                "options": [
                    "Structured Query Language",
                    "Simple Query Language",
                    "Standard Query Language",
                    "System Query Language"
                ],
                "correct_answer": 0,
                "points": 5,
                "category": "Database"
            },
            {
                "id": 5,
                "type": "mcq",
                "title": "Web Development",
                "description": "Which HTTP method is used to retrieve data?",
                "options": ["POST", "GET", "PUT", "DELETE"],
                "correct_answer": 1,
                "points": 5,
                "category": "Web Development"
            },
            {
                "id": 6,
                "type": "mcq",
                "title": "Software Engineering",
                "description": "What is the main purpose of version control?",
                "options": [
                    "Code compilation",
                    "Track changes and collaboration",
                    "Code execution",
                    "Bug fixing"
                ],
                "correct_answer": 1,
                "points": 5,
                "category": "Software Engineering"
            },
            {
                "id": 7,
                "type": "mcq",
                "title": "Programming Logic",
                "description": "What will be the output of: print(2 ** 3)?",
                "options": ["6", "8", "9", "23"],
                "correct_answer": 1,
                "points": 5,
                "category": "Programming"
            },
            {
                "id": 8,
                "type": "mcq",
                "title": "Network Concepts",
                "description": "What does API stand for?",
                "options": [
                    "Application Programming Interface",
                    "Advanced Programming Interface",
                    "Application Process Interface",
                    "Automated Programming Interface"
                ],
                "correct_answer": 0,
                "points": 5,
                "category": "Networking"
            },
            {
                "id": 9,
                "type": "mcq",
                "title": "Security",
                "description": "What is the purpose of HTTPS?",
                "options": [
                    "Faster data transfer",
                    "Secure data transmission",
                    "Better SEO ranking",
                    "Reduced server load"
                ],
                "correct_answer": 1,
                "points": 5,
                "category": "Security"
            },
            {
                "id": 10,
                "type": "mcq",
                "title": "Testing",
                "description": "What is unit testing?",
                "options": [
                    "Testing the entire application",
                    "Testing individual components",
                    "Testing user interface",
                    "Testing database connections"
                ],
                "correct_answer": 1,
                "points": 5,
                "category": "Testing"
            },
            # Coding Questions (2)
            {
                "id": 11,
                "type": "coding",
                "title": "Array Manipulation",
                "description": "Write a function to find the maximum element in an array.\n\nExample:\nInput: [1, 5, 3, 9, 2]\nOutput: 9",
                "starter_code": "def find_max(arr):\n    # Your code here\n    pass",
                "expected_solution": "def find_max(arr):\n    if not arr:\n        return None\n    return max(arr)",
                "points": 25,
                "category": "Problem Solving",
                "difficulty": "Easy"
            },
            {
                "id": 12,
                "type": "coding",
                "title": "String Processing",
                "description": "Write a function to check if a string is a palindrome (reads the same forwards and backwards).\n\nExample:\nInput: 'racecar'\nOutput: True\n\nInput: 'hello'\nOutput: False",
                "starter_code": "def is_palindrome(s):\n    # Your code here\n    pass",
                "expected_solution": "def is_palindrome(s):\n    s = s.lower().replace(' ', '')\n    return s == s[::-1]",
                "points": 25,
                "category": "Problem Solving",
                "difficulty": "Easy"
            }
        ],
        "total_points": 100,
        "mcq_count": 10,
        "coding_count": 2
    }

async def generate_assessment_questions(job_data: Dict[str, Any], candidate_skills: List[str]) -> Dict[str, Any]:
    """
    Generate 10 MCQs and 2 coding questions based on job requirements and candidate skills
    Currently using fallback questions, can be enhanced with AI later
    """
    
    print(f"Generating assessment for: {job_data.get('title', 'Unknown Position')}")
    print(f"Required skills: {job_data.get('required_skills', [])}")
    print(f"Candidate skills: {candidate_skills}")
    
    # For now, return default questions
    # TODO: Implement skill-based question generation
    questions_data = get_default_questions()
    
    # Customize questions based on job requirements if possible
    job_skills = job_data.get('required_skills', [])
    if job_skills:
        print(f"Customizing questions for skills: {job_skills}")
        # Could customize questions here based on required skills
    
    return questions_data

async def evaluate_assessment_answers(questions: List[Dict], answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate assessment answers and calculate score
    """
    total_points = 0
    earned_points = 0
    detailed_results = []
    
    for question in questions:
        q_id = str(question["id"])
        points = question.get("points", 0)
        total_points += points
        
        if q_id not in answers:
            detailed_results.append({
                "question_id": q_id,
                "points_possible": points,
                "points_earned": 0,
                "correct": False,
                "feedback": "No answer provided"
            })
            continue
        
        if question["type"] == "mcq":
            # MCQ evaluation
            correct_answer = question.get("correct_answer", 0)
            user_answer = answers[q_id]
            
            if isinstance(user_answer, int) and user_answer == correct_answer:
                earned_points += points
                detailed_results.append({
                    "question_id": q_id,
                    "points_possible": points,
                    "points_earned": points,
                    "correct": True,
                    "feedback": "Correct answer"
                })
            else:
                detailed_results.append({
                    "question_id": q_id,
                    "points_possible": points,
                    "points_earned": 0,
                    "correct": False,
                    "feedback": f"Incorrect. Correct answer: {question['options'][correct_answer]}"
                })
        
        elif question["type"] == "coding":
            # Basic coding evaluation (can be enhanced with AI later)
            user_code = answers[q_id]
            
            # Simple evaluation based on code presence and basic checks
            score = evaluate_coding_answer_basic(question, user_code)
            points_earned = int(points * score)
            earned_points += points_earned
            
            detailed_results.append({
                "question_id": q_id,
                "points_possible": points,
                "points_earned": points_earned,
                "correct": score >= 0.7,
                "feedback": f"Code evaluation score: {score:.2f}"
            })
    
    final_score = int((earned_points / total_points) * 100) if total_points > 0 else 0
    
    return {
        "total_points": total_points,
        "earned_points": earned_points,
        "percentage_score": final_score,
        "passed": final_score >= 70,  # 70% minimum to pass
        "detailed_results": detailed_results
    }

def evaluate_coding_answer_basic(question: Dict, user_code: str) -> float:
    """
    Basic coding answer evaluation without AI
    """
    if not user_code or user_code.strip() == question.get("starter_code", "").strip():
        return 0.0  # No code written
    
    score = 0.0
    
    # Basic checks
    if len(user_code.strip()) > 20:  # Has substantial code
        score += 0.3
    
    if "def " in user_code:  # Has function definition
        score += 0.2
    
    if "return" in user_code:  # Has return statement
        score += 0.2
    
    # Check for common patterns based on question
    question_title = question.get("title", "").lower()
    
    if "max" in question_title and ("max(" in user_code or "maximum" in user_code.lower()):
        score += 0.3
    elif "palindrome" in question_title and ("[::-1]" in user_code or "reverse" in user_code.lower()):
        score += 0.3
    elif "array" in question_title and ("for " in user_code or "while " in user_code):
        score += 0.3
    else:
        score += 0.1  # Some effort shown
    
    return min(1.0, score)