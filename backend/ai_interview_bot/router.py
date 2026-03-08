from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import base64
import logging
from .services.interview_session import SessionManager
from .services.code_executor import execute_code
from .services.proctoring import log_violation
from .services.sarvam_service import transcribe_audio, generate_speech
from .service import evaluate_response
from .services.interview_script_generator import (
    generate_interview_script,
    generate_follow_up_question,
    evaluate_solution
)

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

@router.get("/interview/script/{session_id}")
async def get_interview_script(session_id: str):
    """Get the generated interview script for a session."""
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    
    script = session.get("interview_script", {})
    return {
        "script": script,
        "progress": {
            "currentSection": session.get("current_section", 0),
            "currentQuestion": session.get("current_question", 0),
            "elapsedTime": session.get("elapsed_time", 0)
        }
    }

@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str, position: str = "Engineer", company: str = "Tech Company"):
    await websocket.accept()
    logger.info(f"WebSocket accepted for session: {session_id}")
    
    try:
        session = session_manager.create_session(session_id)
        session["position"] = position
        session["company"] = company
        logger.info(f"Session created: {session_id} - {position} at {company}")

        # Generate comprehensive interview script
        try:
            interview_script = generate_interview_script(position, company)
            session["interview_script"] = interview_script
            logger.info(f"Interview script generated with {len(interview_script.get('sections', []))} sections")
            
            # Send script overview to client
            await websocket.send_json({
                "type": "interview_started",
                "script": interview_script,
                "totalDuration": interview_script.get("totalDuration", 45),
                "message": f"Welcome! This is a {interview_script.get('totalDuration', 45)}-minute interview for {position}."
            })
            
        except Exception as e:
            logger.error(f"Error generating interview script: {str(e)}", exc_info=True)
            await websocket.send_json({
                "type": "error",
                "message": f"Failed to generate interview script: {str(e)}"
            })
            await websocket.close()
            return

        # Send first question from the script
        try:
            sections = interview_script.get("sections", [])
            if sections:
                # Start with introduction
                intro_section = sections[0]
                intro_text = intro_section.get("content", "")
                
                if intro_text:
                    intro_audio = generate_speech(intro_text)
                    session["current_section"] = 0
                    session["current_question"] = 0
                    
                    await websocket.send_json({
                        "type": "section_started",
                        "section": intro_section.get("name", "Introduction"),
                        "text": intro_text,
                        "audio": intro_audio,
                        "duration": intro_section.get("duration", 2)
                    })
                    
                    session_manager.add_transcript(session_id, "bot", intro_text)
                    logger.info("Introduction sent to candidate")
                
        except Exception as e:
            logger.error(f"Error sending introduction: {str(e)}", exc_info=True)

        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                msg_type = message.get("type")
                logger.info(f"Received message type: {msg_type}")

                if msg_type == "candidate_response":
                    response_text = message.get("text", "")
                    session_manager.add_transcript(session_id, "candidate", response_text)
                    
                    # Generate follow-up question
                    current_section = session.get("current_section", 0)
                    sections = interview_script.get("sections", [])
                    
                    if current_section < len(sections):
                        section = sections[current_section]
                        follow_up = generate_follow_up_question(session, section.get("type", "technical"))
                        follow_up_audio = generate_speech(follow_up)
                        
                        session_manager.add_transcript(session_id, "bot", follow_up)
                        
                        await websocket.send_json({
                            "type": "follow_up_question",
                            "text": follow_up,
                            "audio": follow_up_audio
                        })
                        logger.info("Follow-up question sent")

                elif msg_type == "move_to_next_section":
                    current = session.get("current_section", 0)
                    sections = interview_script.get("sections", [])
                    next_section_idx = current + 1
                    
                    if next_section_idx < len(sections):
                        session["current_section"] = next_section_idx
                        section = sections[next_section_idx]
                        
                        if section.get("type") == "coding":
                            # Send coding challenge
                            challenges = section.get("challenges", [])
                            if challenges:
                                challenge = challenges[0]
                                challenge_text = f"{challenge.get('title')}\n\n{challenge.get('description')}"
                                
                                await websocket.send_json({
                                    "type": "coding_challenge",
                                    "challenge": challenge,
                                    "starterCode": challenge.get("starterCode", ""),
                                    "timeLimit": challenge.get("timeLimit", 12)
                                })
                                logger.info("Coding challenge sent")
                        
                        elif section.get("type") == "behavioral":
                            questions = section.get("questions", [])
                            if questions:
                                question = questions[0]
                                q_text = question.get("question", "")
                                q_audio = generate_speech(q_text)
                                
                                await websocket.send_json({
                                    "type": "behavioral_question",
                                    "question": q_text,
                                    "audio": q_audio,
                                    "timeLimit": question.get("timeLimit", 2)
                                })
                                logger.info("Behavioral question sent")
                        
                        elif section.get("type") == "closing":
                            closing_text = section.get("content", "Thank you for the interview!")
                            closing_audio = generate_speech(closing_text)
                            
                            await websocket.send_json({
                                "type": "interview_closing",
                                "text": closing_text,
                                "audio": closing_audio
                            })
                            logger.info("Interview closing sent")
                    else:
                        # Interview complete
                        await websocket.send_json({
                            "type": "interview_complete",
                            "message": "Interview completed! Your responses will be reviewed by our AI system."
                        })
                        session_manager.end_session(session_id)
                        await websocket.close()

                elif msg_type == "code_submission":
                    code = message.get("code", "")
                    language = message.get("language", "javascript")
                    
                    # Execute code
                    result = execute_code(code, language, "4")
                    
                    # Evaluate solution
                    sections = interview_script.get("sections", [])
                    current_section = session.get("current_section", 0)
                    
                    problem_desc = ""
                    if current_section < len(sections):
                        section = sections[current_section]
                        challenges = section.get("challenges", [])
                        if challenges:
                            problem_desc = challenges[0].get("description", "")
                    
                    evaluation = evaluate_solution(code, language, problem_desc)
                    
                    await websocket.send_json({
                        "type": "code_evaluation",
                        "execution": result,
                        "evaluation": evaluation
                    })
                    logger.info(f"Code evaluated - Score: {evaluation.get('score', 0)}")

                elif msg_type == "run_code":
                    code = message.get("code", "")
                    language = message.get("language", "javascript")
                    result = execute_code(code, language, "4")
                    
                    if "error" in result:
                        await websocket.send_json({
                            "type": "execution_result",
                            "error": result["error"]
                        })
                    else:
                        await websocket.send_json({
                            "type": "execution_result",
                            "output": result.get("output", ""),
                            "memory": result.get("memory", 0),
                            "cpuTime": result.get("cpuTime", 0)
                        })

                elif msg_type == "proctor_event":
                    log_violation(session_id, message.get("event"), session_manager)

                else:
                    await websocket.send_json({"type": "error", "message": "unsupported message type"})

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected: {session_id}")
            session_manager.end_session(session_id)
        except Exception as e:
            logger.error(f"Error in websocket loop: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except:
                pass
            session_manager.end_session(session_id)
    
    except Exception as e:
        logger.error(f"Unexpected error in websocket handler: {str(e)}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass