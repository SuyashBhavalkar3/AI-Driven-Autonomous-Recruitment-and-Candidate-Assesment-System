"""
Real-time AI Interview Service with Sarvam AI Integration
Handles scoring, session management, and real-time interactions
"""

import json
import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from .sarvam_service import generate_speech, transcribe_audio
from .adaptive_interview_bot import adaptive_bot

logger = logging.getLogger(__name__)

@dataclass
class InterviewQuestion:
    id: str
    question: str
    expected_keywords: List[str]
    max_score: int = 10
    time_limit: int = 120  # seconds

@dataclass
class InterviewSession:
    session_id: str
    application_id: str
    candidate_id: str
    position: str
    company: str
    questions: List[InterviewQuestion]
    current_question_index: int = 0
    total_score: int = 0
    max_questions: int = 10
    start_time: float = 0
    end_time: Optional[float] = None
    is_active: bool = True
    violations: int = 0
    max_violations: int = 3
    responses: List[Dict] = None
    
    def __post_init__(self):
        if self.responses is None:
            self.responses = []
        if self.start_time == 0:
            self.start_time = time.time()

class RealTimeInterviewService:
    def __init__(self):
        self.active_sessions: Dict[str, InterviewSession] = {}
        self.question_templates = {
            "software_engineer": [
                {
                    "question": "Tell me about your experience with Python and how you've used it in previous projects.",
                    "keywords": ["python", "projects", "experience", "development", "programming"],
                    "max_score": 10
                },
                {
                    "question": "Describe a challenging technical problem you solved and your approach to solving it.",
                    "keywords": ["problem", "solution", "approach", "technical", "challenge"],
                    "max_score": 10
                },
                {
                    "question": "How do you ensure code quality and what testing practices do you follow?",
                    "keywords": ["testing", "quality", "code review", "best practices", "debugging"],
                    "max_score": 10
                },
                {
                    "question": "Explain your experience with databases and how you optimize database queries.",
                    "keywords": ["database", "sql", "optimization", "queries", "performance"],
                    "max_score": 10
                },
                {
                    "question": "How do you handle version control and collaboration in team projects?",
                    "keywords": ["git", "version control", "collaboration", "team", "merge"],
                    "max_score": 10
                }
            ],
            "data_scientist": [
                {
                    "question": "Describe your experience with machine learning algorithms and which ones you've implemented.",
                    "keywords": ["machine learning", "algorithms", "implementation", "models", "data"],
                    "max_score": 10
                },
                {
                    "question": "How do you approach data cleaning and preprocessing in your projects?",
                    "keywords": ["data cleaning", "preprocessing", "pandas", "numpy", "analysis"],
                    "max_score": 10
                }
            ]
        }
    
    def create_session(self, session_id: str, application_id: str, candidate_id: str, 
                      position: str, company: str) -> InterviewSession:
        """Create a new interview session"""
        # Generate questions based on position
        questions = self._generate_questions(position)
        
        session = InterviewSession(
            session_id=session_id,
            application_id=application_id,
            candidate_id=candidate_id,
            position=position,
            company=company,
            questions=questions
        )
        
        self.active_sessions[session_id] = session
        logger.info(f"Created interview session {session_id} for {position} at {company}")
        return session
    
    def _generate_questions(self, position: str) -> List[InterviewQuestion]:
        """Generate interview questions based on position"""
        position_key = position.lower().replace(" ", "_")
        templates = self.question_templates.get(position_key, self.question_templates["software_engineer"])
        
        questions = []
        for i, template in enumerate(templates[:10]):  # Max 10 questions
            question = InterviewQuestion(
                id=f"q_{i+1}",
                question=template["question"],
                expected_keywords=template["keywords"],
                max_score=template["max_score"]
            )
            questions.append(question)
        
        return questions
    
    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get active session"""
        return self.active_sessions.get(session_id)
    
    def get_current_question(self, session_id: str) -> Optional[Dict]:
        """Get current question for session"""
        session = self.get_session(session_id)
        if not session or not session.is_active:
            return None
        
        if session.current_question_index >= len(session.questions):
            return None
        
        current_q = session.questions[session.current_question_index]
        return {
            "id": current_q.id,
            "question": current_q.question,
            "question_number": session.current_question_index + 1,
            "total_questions": len(session.questions),
            "time_limit": current_q.time_limit,
            "audio": generate_speech(current_q.question)
        }
    
    def process_response(self, session_id: str, response_text: str, 
                        response_time: float) -> Dict:
        """Process candidate response and calculate score"""
        session = self.get_session(session_id)
        if not session or not session.is_active:
            return {"error": "Invalid session"}
        
        if session.current_question_index >= len(session.questions):
            return {"error": "No more questions"}
        
        current_q = session.questions[session.current_question_index]
        
        # Calculate score based on keywords and response quality
        score = self._calculate_response_score(response_text, current_q)
        
        # Store response
        response_data = {
            "question_id": current_q.id,
            "question": current_q.question,
            "response": response_text,
            "score": score,
            "max_score": current_q.max_score,
            "response_time": response_time,
            "timestamp": time.time()
        }
        session.responses.append(response_data)
        session.total_score += score
        
        # Move to next question
        session.current_question_index += 1
        
        # Check if interview is complete
        if session.current_question_index >= min(len(session.questions), session.max_questions):
            return self._complete_interview(session_id)
        
        # Generate next question using adaptive bot
        next_question_data = self.get_current_question(session_id)
        if next_question_data:
            # Use adaptive bot for follow-up
            bot_response = adaptive_bot.generate_next_question(
                session=asdict(session),
                candidate_response=response_text,
                position=session.position,
                company=session.company
            )
            
            return {
                "type": "next_question",
                "current_score": score,
                "total_score": session.total_score,
                "max_possible": session.current_question_index * 10,
                "next_question": next_question_data,
                "feedback": f"Score: {score}/{current_q.max_score}",
                "bot_message": bot_response.get("message", ""),
                "progress": {
                    "current": session.current_question_index,
                    "total": min(len(session.questions), session.max_questions)
                }
            }
        
        return self._complete_interview(session_id)
    
    def _calculate_response_score(self, response: str, question: InterviewQuestion) -> int:
        """Calculate score based on response quality and keywords"""
        if not response or len(response.strip()) < 10:
            return 1  # Minimum score for very short responses
        
        response_lower = response.lower()
        keyword_matches = sum(1 for keyword in question.expected_keywords 
                            if keyword.lower() in response_lower)
        
        # Base score calculation
        keyword_score = min(6, keyword_matches * 2)  # Max 6 points for keywords
        
        # Length and quality bonus
        length_bonus = min(2, len(response.split()) // 20)  # Up to 2 points for length
        
        # Technical depth bonus (simple heuristic)
        technical_words = ["implement", "develop", "design", "optimize", "analyze", 
                          "solution", "approach", "method", "algorithm", "framework"]
        technical_score = min(2, sum(1 for word in technical_words 
                                   if word in response_lower))
        
        total_score = keyword_score + length_bonus + technical_score
        return min(question.max_score, max(1, total_score))
    
    def _complete_interview(self, session_id: str) -> Dict:
        """Complete the interview and calculate final results"""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        session.is_active = False
        session.end_time = time.time()
        
        # Calculate final metrics
        total_possible = len(session.responses) * 10
        percentage_score = (session.total_score / total_possible * 100) if total_possible > 0 else 0
        
        # Generate completion message
        completion_message = f"Interview completed! You scored {session.total_score} out of {total_possible} points ({percentage_score:.1f}%)."
        completion_audio = generate_speech(completion_message)
        
        result = {
            "type": "interview_complete",
            "session_id": session_id,
            "total_score": session.total_score,
            "max_possible": total_possible,
            "percentage": percentage_score,
            "questions_answered": len(session.responses),
            "duration": session.end_time - session.start_time,
            "completion_message": completion_message,
            "completion_audio": completion_audio,
            "detailed_responses": session.responses
        }
        
        logger.info(f"Interview {session_id} completed with score {percentage_score:.1f}%")
        return result
    
    def add_violation(self, session_id: str, violation_type: str) -> Dict:
        """Add a proctoring violation"""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        session.violations += 1
        logger.warning(f"Violation in session {session_id}: {violation_type} (Total: {session.violations})")
        
        if session.violations >= session.max_violations:
            session.is_active = False
            session.end_time = time.time()
            
            return {
                "type": "interview_terminated",
                "reason": "excessive_violations",
                "violations": session.violations,
                "message": "Interview terminated due to excessive violations."
            }
        
        return {
            "type": "violation_warning",
            "violations": session.violations,
            "max_violations": session.max_violations,
            "message": f"Warning: {violation_type}. {session.max_violations - session.violations} warnings remaining."
        }
    
    def end_session(self, session_id: str) -> Dict:
        """End session and cleanup"""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        if session.is_active:
            result = self._complete_interview(session_id)
        else:
            result = {"type": "session_ended", "message": "Session already completed"}
        
        # Keep session data for a while for retrieval
        # In production, you might want to store this in a database
        return result
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Get session summary for database storage"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            "session_id": session_id,
            "application_id": session.application_id,
            "candidate_id": session.candidate_id,
            "total_score": session.total_score,
            "max_possible": len(session.responses) * 10,
            "percentage": (session.total_score / (len(session.responses) * 10) * 100) if session.responses else 0,
            "questions_answered": len(session.responses),
            "violations": session.violations,
            "duration": (session.end_time or time.time()) - session.start_time,
            "responses": session.responses,
            "completed": not session.is_active
        }

# Global instance
interview_service = RealTimeInterviewService()