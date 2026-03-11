import openai
import os
import json
import logging
import requests
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
JDOODLE_CLIENT_ID = os.getenv("JDOODLE_CLIENT_ID")
JDOODLE_CLIENT_SECRET = os.getenv("JDOODLE_CLIENT_SECRET")
logger = logging.getLogger(__name__)


DSA_PROMPT_TEMPLATE = """
You are an expert technical interviewer specializing in Data Structures and Algorithms.

Generate 2 medium-difficulty DSA coding questions suitable for a technical interview.

Resume Skills and Experience:
{resume_summary}

Job Requirements:
- Title: {job_title}
- Required Skills: {required_skills}

Generate 2 DSA questions that:
1. Are medium difficulty (similar to LeetCode Medium)
2. Test fundamental DSA concepts (arrays, strings, hashing, stacks, queues, trees, graphs, DP)
3. Are relevant to the candidate's skill level
4. Have clear problem statements
5. Include example inputs and outputs
6. Can be solved in 30-45 minutes each

For each question, provide:
- question_text: Clear problem statement
- difficulty: "medium"
- topic: DSA topic (e.g., "Arrays", "Hashing", "Dynamic Programming")
- example_input: Sample input as string
- example_output: Expected output as string
- explanation: Brief explanation of the approach
- expected_time_complexity: e.g., "O(n)", "O(n log n)"
- expected_space_complexity: e.g., "O(1)", "O(n)"
- test_cases: Array of 3-5 test cases with input and output
- constraints: Problem constraints (e.g., "1 <= n <= 10^5")

Return ONLY valid JSON array:
[
  {{
    "question_text": "...",
    "difficulty": "medium",
    "topic": "...",
    "example_input": "...",
    "example_output": "...",
    "explanation": "...",
    "expected_time_complexity": "...",
    "expected_space_complexity": "...",
    "test_cases": [
      {{"input": "...", "output": "..."}},
      {{"input": "...", "output": "..."}}
    ],
    "constraints": "..."
  }},
  ...
]
"""


async def generate_dsa_questions(
    parsed_resume: Dict[str, Any],
    job_data: Dict[str, Any],
    num_questions: int = 2
) -> List[Dict[str, Any]]:
    """
    Generate DSA coding questions using LLM.
    
    Args:
        parsed_resume: Candidate's resume data
        job_data: Job requirements
        num_questions: Number of DSA questions (default: 2)
    
    Returns:
        List of DSA questions with test cases
    """
    
    try:
        from assessment.assessment_service import format_resume_for_prompt
        
        resume_summary = format_resume_for_prompt(parsed_resume)
        
        prompt = DSA_PROMPT_TEMPLATE.format(
            resume_summary=resume_summary,
            job_title=job_data.get('title', 'Software Engineer'),
            required_skills=json.dumps(job_data.get('required_skills', []))
        )
        
        logger.info(f"Generating {num_questions} DSA coding questions using GPT")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert DSA interviewer. Return only valid JSON arrays."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=3000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        questions = json.loads(response_text)
        questions = questions[:num_questions]
        
        # Validate questions
        validated_questions = []
        for q in questions:
            if validate_dsa_question(q):
                validated_questions.append(q)
        
        logger.info(f"Successfully generated {len(validated_questions)} DSA questions")
        return validated_questions
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse DSA questions JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Error generating DSA questions: {str(e)}")
        return []


def validate_dsa_question(question: Dict[str, Any]) -> bool:
    """Validate DSA question has required fields."""
    
    required_fields = [
        'question_text', 'difficulty', 'topic', 
        'example_input', 'example_output', 'test_cases'
    ]
    
    for field in required_fields:
        if field not in question or not question[field]:
            logger.warning(f"DSA question missing field: {field}")
            return False
    
    # Validate test_cases is a list
    if not isinstance(question['test_cases'], list) or len(question['test_cases']) == 0:
        logger.warning("DSA question has invalid test_cases")
        return False
    
    return True


async def execute_code_jdoodle(
    code: str,
    language: str,
    stdin: str = ""
) -> Dict[str, Any]:
    """
    Execute code using JDoodle API.
    
    Args:
        code: Source code to execute
        language: Programming language (python3, java, cpp17, etc.)
        stdin: Standard input for the program
    
    Returns:
        Execution result with output, error, time, memory
    """
    
    if not JDOODLE_CLIENT_ID or not JDOODLE_CLIENT_SECRET:
        logger.error("JDoodle credentials not configured")
        return {
            "success": False,
            "error": "Code execution service not configured",
            "output": "",
            "time": 0,
            "memory": 0
        }
    
    url = "https://api.jdoodle.com/v1/execute"
    
    payload = {
        "clientId": JDOODLE_CLIENT_ID,
        "clientSecret": JDOODLE_CLIENT_SECRET,
        "script": code,
        "language": language,
        "stdin": stdin,
        "versionIndex": "0"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        return {
            "success": True,
            "output": result.get("output", "").strip(),
            "error": result.get("error", ""),
            "time": float(result.get("cpuTime", 0)),
            "memory": float(result.get("memory", 0))
        }
        
    except requests.exceptions.Timeout:
        logger.error("JDoodle API timeout")
        return {
            "success": False,
            "error": "Execution timeout",
            "output": "",
            "time": 0,
            "memory": 0
        }
    except Exception as e:
        logger.error(f"JDoodle execution error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "output": "",
            "time": 0,
            "memory": 0
        }


async def evaluate_dsa_submission(
    code: str,
    language: str,
    test_cases: List[Dict[str, str]],
    expected_time_complexity: str = None
) -> Dict[str, Any]:
    """
    Evaluate DSA code submission against test cases.
    
    Args:
        code: Candidate's code
        language: Programming language
        test_cases: List of test cases with input and expected output
        expected_time_complexity: Expected time complexity
    
    Returns:
        Evaluation result with score and feedback
    """
    
    total_test_cases = len(test_cases)
    passed_test_cases = 0
    execution_results = []
    
    for i, test_case in enumerate(test_cases):
        test_input = test_case.get("input", "")
        expected_output = test_case.get("output", "").strip()
        
        # Execute code with test input
        result = await execute_code_jdoodle(code, language, test_input)
        
        if not result["success"]:
            execution_results.append({
                "test_case": i + 1,
                "passed": False,
                "error": result["error"]
            })
            continue
        
        actual_output = result["output"].strip()
        
        # Compare outputs
        if actual_output == expected_output:
            passed_test_cases += 1
            execution_results.append({
                "test_case": i + 1,
                "passed": True,
                "time": result["time"]
            })
        else:
            execution_results.append({
                "test_case": i + 1,
                "passed": False,
                "expected": expected_output,
                "actual": actual_output
            })
    
    # Calculate score (30 marks per DSA question)
    # Base score: 70% for correctness, 30% for all test cases passing
    correctness_ratio = passed_test_cases / total_test_cases
    
    if correctness_ratio == 1.0:
        marks = 30  # Full marks if all test cases pass
    elif correctness_ratio >= 0.8:
        marks = 24  # 80% marks if 80%+ test cases pass
    elif correctness_ratio >= 0.6:
        marks = 18  # 60% marks if 60%+ test cases pass
    elif correctness_ratio >= 0.4:
        marks = 12  # 40% marks if 40%+ test cases pass
    else:
        marks = int(correctness_ratio * 30)  # Proportional marks
    
    return {
        "marks_obtained": marks,
        "test_cases_passed": passed_test_cases,
        "total_test_cases": total_test_cases,
        "is_correct": passed_test_cases == total_test_cases,
        "execution_results": execution_results,
        "feedback": {
            "correctness": f"{passed_test_cases}/{total_test_cases} test cases passed",
            "score_breakdown": f"{marks}/30 marks",
            "suggestion": "All test cases passed!" if passed_test_cases == total_test_cases else "Review failed test cases"
        }
    }