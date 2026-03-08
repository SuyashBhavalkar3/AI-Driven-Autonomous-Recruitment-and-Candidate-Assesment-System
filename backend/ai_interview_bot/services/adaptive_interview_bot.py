import logging
from openai import OpenAI
from dotenv import load_dotenv
import os
import re
from ..config import (
    REFUSAL_KEYWORDS,
    HITL_KEYWORDS,
    INTERVIEW_STAGES,
    STAGE_THRESHOLDS,
    SHORT_RESPONSE_THRESHOLD,
    DETAILED_RESPONSE_THRESHOLD,
    CONTEXT_WINDOW_SIZE,
    AI_MODEL,
    TEMPERATURE,
    MAX_RESPONSE_TOKENS,
    REFUSAL_RESPONSE,
    HITL_RESPONSE,
    GREETING_TEMPLATE,
    STAGE_GUIDANCE,
    SAFETY_PROMPT,
)

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)


class AdaptiveInterviewBot:
    """AI Interview Bot with adaptive questioning and behavioral rules."""
    
    def __init__(self):
        self.interview_stages = INTERVIEW_STAGES
        self.refusal_keywords = REFUSAL_KEYWORDS
        self.hitl_keywords = HITL_KEYWORDS
    
    def detect_refusal(self, text: str) -> bool:
        """Detect if candidate wants to stop the interview."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.refusal_keywords)
    
    def detect_hitl_request(self, text: str) -> bool:
        """Detect if candidate needs human intervention."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.hitl_keywords)
    
    def get_refusal_response(self) -> dict:
        """Return polite refusal response."""
        return {
            "message": REFUSAL_RESPONSE,
            "action": "end_interview",
            "reason": "candidate_declined"
        }
    
    def get_hitl_response(self) -> dict:
        """Return HITL escalation response."""
        return {
            "message": HITL_RESPONSE,
            "action": "escalate_to_human",
            "reason": "human_intervention_required"
        }
    
    def generate_next_question(
        self, 
        session: dict, 
        candidate_response: str,
        position: str,
        company: str
    ) -> dict:
        """Generate adaptive next question based on candidate's response.
        
        Returns:
            dict with 'message', 'action', and optional metadata
        """
        
        # Check for refusal
        if self.detect_refusal(candidate_response):
            return self.get_refusal_response()
        
        # Check for HITL request
        if self.detect_hitl_request(candidate_response):
            return self.get_hitl_response()
        
        # Get conversation context
        transcript = session.get("transcript", [])
        current_stage = session.get("current_stage", "greeting")
        questions_asked = len([t for t in transcript if t.get("speaker") == "bot"])
        
        # Build conversation history for context
        conversation_history = self._build_conversation_history(transcript)
        
        # Determine response length
        response_length = len(candidate_response.split())
        is_short_response = response_length < SHORT_RESPONSE_THRESHOLD
        is_detailed_response = response_length > DETAILED_RESPONSE_THRESHOLD
        
        # Generate adaptive question using LLM
        system_prompt = self._build_system_prompt(
            position, 
            company, 
            current_stage,
            is_short_response,
            is_detailed_response
        )
        
        try:
            response = client.chat.completions.create(
                model=AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *conversation_history,
                    {"role": "user", "content": candidate_response}
                ],
                temperature=TEMPERATURE,
                max_tokens=MAX_RESPONSE_TOKENS
            )
            
            bot_message = response.choices[0].message.content.strip()
            
            # Determine next stage if needed
            next_stage = self._determine_next_stage(
                current_stage, 
                questions_asked,
                is_detailed_response
            )
            
            return {
                "message": bot_message,
                "action": "continue",
                "next_stage": next_stage,
                "metadata": {
                    "response_length": response_length,
                    "questions_asked": questions_asked
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating adaptive question: {str(e)}", exc_info=True)
            return {
                "message": "Could you tell me more about that?",
                "action": "continue",
                "next_stage": current_stage
            }
    
    def _build_system_prompt(
        self, 
        position: str, 
        company: str,
        current_stage: str,
        is_short_response: bool,
        is_detailed_response: bool
    ) -> str:
        """Build adaptive system prompt based on context."""
        
        base_prompt = f"""You are a professional AI recruiter conducting an interview for the {position} position at {company}.

STRICT BEHAVIORAL RULES:

1. ADAPTIVE QUESTIONING:
   - Always generate the next question based on the candidate's previous response
   - Reference specific details from their answer
   - {"Ask follow-up questions to gather more detail since the response was brief" if is_short_response else ""}
   - {"Move to the next logical topic since the response was detailed" if is_detailed_response else ""}

2. INTERVIEW FLOW:
   Current Stage: {current_stage}
   Follow this structure: Greeting → Introduction → Experience → Skills → Scenarios → Candidate Questions → Closing
   Adapt dynamically based on responses.

3. CONTEXT AWARENESS:
   - Remember and reference previous answers
   - Build on earlier conversation points
   - Show you're listening by connecting topics

4. PROFESSIONAL TONE:
   - Be polite and concise
   - Sound like a real recruiter, not robotic
   - Never use phrases like "Great!", "Excellent!", "That's fascinating!"
   - Get straight to the question

5. SAFETY:
   - Never ask discriminatory questions (age, race, religion, marital status, etc.)
   - Keep questions professional and job-relevant

6. OUTPUT FORMAT:
   - Respond ONLY with the next message to send the candidate
   - No explanations, no system notes
   - One question or comment at a time
   - Maximum 2-3 sentences

{SAFETY_PROMPT}

CURRENT STAGE GUIDANCE:
"""
        
        return base_prompt + STAGE_GUIDANCE.get(current_stage, "Continue the interview naturally.")
    
    def _build_conversation_history(self, transcript: list) -> list:
        """Convert transcript to OpenAI message format."""
        messages = []
        for entry in transcript[-CONTEXT_WINDOW_SIZE:]:  # Use configured context window
            role = "assistant" if entry.get("speaker") == "bot" else "user"
            messages.append({
                "role": role,
                "content": entry.get("message", "")
            })
        return messages
    
    def _determine_next_stage(
        self, 
        current_stage: str, 
        questions_asked: int,
        is_detailed_response: bool
    ) -> str:
        """Determine if we should move to next interview stage."""
        
        current_idx = self.interview_stages.index(current_stage)
        
        # Move to next stage if threshold met and response was detailed
        if questions_asked >= STAGE_THRESHOLDS.get(current_stage, 999):
            if current_idx < len(self.interview_stages) - 1:
                return self.interview_stages[current_idx + 1]
        
        return current_stage
    
    def generate_greeting(self, position: str, company: str) -> str:
        """Generate initial greeting message."""
        return GREETING_TEMPLATE.format(position=position, company=company)


# Singleton instance
adaptive_bot = AdaptiveInterviewBot()
