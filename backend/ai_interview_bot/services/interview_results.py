"""
Interview Results Service
Handles storing interview results and updating application status
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from applications.models import Application, ApplicationStatus
from authentication.database import get_db
from .real_time_interview import interview_service
import logging
import json
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class InterviewResultsService:
    def __init__(self):
        pass
    
    def store_interview_results(self, session_id: str, db: Session) -> Dict:
        """Store interview results in database and update application status"""
        try:
            # Get session summary from interview service
            session_summary = interview_service.get_session_summary(session_id)
            if not session_summary:
                return {"error": "Session not found"}
            
            application_id = session_summary.get("application_id")
            if not application_id:
                return {"error": "Application ID not found"}
            
            # Find the application
            application = db.query(Application).filter(
                Application.id == application_id
            ).first()
            
            if not application:
                return {"error": "Application not found"}
            
            # Calculate final interview score
            percentage_score = session_summary.get("percentage", 0)
            
            # Update application with interview results
            application.interview_score = percentage_score
            application.interview_transcript = {
                "session_id": session_id,
                "responses": session_summary.get("responses", []),
                "duration": session_summary.get("duration", 0),
                "violations": session_summary.get("violations", 0),
                "questions_answered": session_summary.get("questions_answered", 0)
            }
            
            # Generate interview feedback
            feedback = self._generate_interview_feedback(session_summary)
            application.interview_feedback = feedback
            
            # Update application status
            if session_summary.get("completed", False):
                if percentage_score >= 60:  # Pass threshold
                    application.status = ApplicationStatus.INTERVIEW_COMPLETED
                else:
                    application.status = ApplicationStatus.REJECTED
                    application.hr_notes = f"Interview failed with score {percentage_score:.1f}%"
            else:
                # Interview was terminated or incomplete
                application.status = ApplicationStatus.REJECTED
                application.hr_notes = "Interview terminated due to violations or technical issues"
            
            # Calculate final score (combination of resume, assessment, and interview)
            final_score = self._calculate_final_score(application)
            application.final_score = final_score
            
            db.commit()
            
            logger.info(f"Interview results stored for application {application_id}: {percentage_score:.1f}%")
            
            return {
                "success": True,
                "application_id": application_id,
                "interview_score": percentage_score,
                "final_score": final_score,
                "status": application.status.value,
                "feedback": feedback
            }
            
        except Exception as e:
            logger.error(f"Error storing interview results: {str(e)}", exc_info=True)
            db.rollback()
            return {"error": f"Failed to store results: {str(e)}"}
    
    def _generate_interview_feedback(self, session_summary: Dict) -> Dict:
        """Generate structured feedback based on interview performance"""
        responses = session_summary.get("responses", [])
        total_score = session_summary.get("total_score", 0)
        max_possible = session_summary.get("max_possible", 0)
        percentage = session_summary.get("percentage", 0)
        violations = session_summary.get("violations", 0)
        
        # Analyze response quality
        avg_response_length = 0
        keyword_matches = 0
        
        if responses:
            total_length = sum(len(r.get("response", "").split()) for r in responses)
            avg_response_length = total_length / len(responses)
            keyword_matches = sum(r.get("score", 0) for r in responses)
        
        # Generate feedback categories
        feedback = {
            "overall_score": percentage,
            "total_questions": len(responses),
            "strengths": [],
            "areas_for_improvement": [],
            "technical_assessment": {
                "communication_skills": min(10, max(1, avg_response_length / 10)),
                "technical_knowledge": min(10, max(1, (keyword_matches / len(responses)) if responses else 1)),
                "professionalism": max(1, 10 - violations * 2)
            },
            "detailed_scores": responses,
            "recommendations": []
        }
        
        # Add strengths based on performance
        if percentage >= 80:
            feedback["strengths"].append("Excellent overall performance")
        if avg_response_length > 50:
            feedback["strengths"].append("Detailed and comprehensive responses")
        if violations == 0:
            feedback["strengths"].append("Perfect adherence to interview guidelines")
        
        # Add areas for improvement
        if percentage < 60:
            feedback["areas_for_improvement"].append("Overall interview performance needs improvement")
        if avg_response_length < 20:
            feedback["areas_for_improvement"].append("Responses could be more detailed and comprehensive")
        if violations > 0:
            feedback["areas_for_improvement"].append("Better adherence to interview guidelines required")
        
        # Add recommendations
        if percentage >= 70:
            feedback["recommendations"].append("Strong candidate for next round")
        elif percentage >= 50:
            feedback["recommendations"].append("Consider for alternative positions")
        else:
            feedback["recommendations"].append("Additional training recommended before reapplication")
        
        return feedback
    
    def _calculate_final_score(self, application: Application) -> float:
        """Calculate final score combining all assessment stages"""
        scores = []
        weights = []
        
        # Resume score (20% weight)
        if application.resume_match_score is not None:
            scores.append(application.resume_match_score)
            weights.append(0.2)
        
        # Assessment score (30% weight)
        if application.assessment_score is not None:
            scores.append(application.assessment_score)
            weights.append(0.3)
        
        # Interview score (50% weight)
        if application.interview_score is not None:
            scores.append(application.interview_score)
            weights.append(0.5)
        
        if not scores:
            return 0.0
        
        # Calculate weighted average
        weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
        total_weight = sum(weights)
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def get_interview_access_status(self, application_id: str, db: Session) -> Dict:
        """Check if candidate can access interview"""
        try:
            application = db.query(Application).filter(
                Application.id == application_id
            ).first()
            
            if not application:
                return {"error": "Application not found", "can_access": False}
            
            # Check if assessment is completed and passed
            if application.status != ApplicationStatus.ASSESSMENT_COMPLETED:
                return {
                    "error": "Assessment must be completed first",
                    "can_access": False,
                    "current_status": application.status.value
                }
            
            # Check if assessment score meets threshold
            if not application.assessment_score or application.assessment_score < 70:
                return {
                    "error": "Assessment score too low for interview",
                    "can_access": False,
                    "assessment_score": application.assessment_score
                }
            
            # Check if interview already completed
            if application.status in [ApplicationStatus.INTERVIEW_COMPLETED, ApplicationStatus.REJECTED, ApplicationStatus.ACCEPTED]:
                return {
                    "error": "Interview already completed",
                    "can_access": False,
                    "current_status": application.status.value
                }
            
            return {
                "can_access": True,
                "application": {
                    "id": application.id,
                    "job_title": application.job.title if application.job else "Unknown",
                    "company_name": application.job.company.name if application.job and application.job.company else "Unknown",
                    "assessment_score": application.assessment_score
                }
            }
            
        except Exception as e:
            logger.error(f"Error checking interview access: {str(e)}", exc_info=True)
            return {"error": f"Access check failed: {str(e)}", "can_access": False}

# Global instance
interview_results_service = InterviewResultsService()