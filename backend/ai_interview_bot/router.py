from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
import json
import base64
import logging
import time
from sqlalchemy.orm import Session
from .services.interview_session import SessionManager
from .services.code_executor import execute_code
from .services.proctoring import log_violation
from .services.sarvam_service import transcribe_audio, generate_speech
from .service import evaluate_response
from .services.real_time_interview import interview_service
from .services.interview_results import interview_results_service
from .services.adaptive_interview_bot import adaptive_bot
from authentication.database import get_db
from applications.models import Application, ApplicationStatus

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

async def safe_send_json(websocket: WebSocket, data: dict):
    """Safely send JSON data through WebSocket with error handling"""
    try:
        await websocket.send_json(data)
        return True
    except Exception as e:
        logger.error(f"Error sending JSON to websocket: {str(e)}")
        return False

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

@router.get("/interview/access/{application_id}")
async def check_interview_access(application_id: str, db: Session = Depends(get_db)):
    """Check if candidate can access interview for this application"""
    result = interview_results_service.get_interview_access_status(application_id, db)
    if not result.get("can_access", False):
        raise HTTPException(status_code=403, detail=result.get("error", "Access denied"))
    return result

@router.post("/interview/complete/{session_id}")
async def complete_interview(session_id: str, db: Session = Depends(get_db)):
    """Store interview results and update application status"""
    result = interview_results_service.store_interview_results(session_id, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.websocket("/ws/interview/{application_id}")
async def interview_websocket(websocket: WebSocket, application_id: str):
    await websocket.accept()
    logger.info(f"WebSocket accepted for application: {application_id}")
    
    session_id = f"interview_{application_id}_{int(time.time())}"
    
    try:
        # Create real-time interview session
        interview_session = interview_service.create_session(
            session_id=session_id,
            application_id=application_id,
            candidate_id="temp_candidate",  # Will be updated with real data
            position="Software Engineer",  # Will be updated with real data
            company="Tech Company"  # Will be updated with real data
        )
        
        logger.info(f"Real-time interview session created: {session_id}")

        # Send welcome message and first question
        try:
            welcome_msg = f"Welcome to your interview! I'll be asking you up to 10 questions. Please answer clearly and concisely."
            welcome_audio = generate_speech(welcome_msg)
            
            await safe_send_json(websocket, {
                "type": "interview_started",
                "message": welcome_msg,
                "audio": welcome_audio,
                "session_id": session_id,
                "max_questions": interview_session.max_questions
            })
            
            # Send first question
            first_question = interview_service.get_current_question(session_id)
            if first_question:
                await safe_send_json(websocket, {
                    "type": "question",
                    **first_question
                })
            
        except Exception as e:
            logger.error(f"Error starting interview: {str(e)}", exc_info=True)
            await safe_send_json(websocket, {
                "type": "error",
                "message": f"Failed to start interview: {str(e)}"
            })
            await websocket.close()
            return

        # Track response timing
        response_start_time = time.time()

        try:
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    msg_type = message.get("type")
                    logger.info(f"Received message type: {msg_type}")

                    if msg_type == "candidate_response":
                        response_text = message.get("text", "")
                        response_time = time.time() - response_start_time
                        
                        # Process response with real-time service
                        result = interview_service.process_response(
                            session_id=session_id,
                            response_text=response_text,
                            response_time=response_time
                        )
                        
                        if "error" in result:
                            await safe_send_json(websocket, {
                                "type": "error",
                                "message": result["error"]
                            })
                            continue
                        
                        # Send result to client
                        await safe_send_json(websocket, result)
                        
                        # If interview is complete, update application and close
                        if result.get("type") == "interview_complete":
                            # Store interview results in database
                            try:
                                from authentication.database import SessionLocal
                                db = SessionLocal()
                                try:
                                    store_result = interview_results_service.store_interview_results(session_id, db)
                                    if "error" not in store_result:
                                        logger.info(f"Interview results stored for application {application_id}")
                                        await safe_send_json(websocket, {
                                            "type": "results_stored",
                                            "final_score": store_result.get("final_score", 0),
                                            "status": store_result.get("status", "unknown")
                                        })
                                    else:
                                        logger.error(f"Failed to store results: {store_result['error']}")
                                finally:
                                    db.close()
                            except Exception as db_error:
                                logger.error(f"Database operation error: {db_error}")
                            
                            await websocket.close()
                            break
                        
                        # Reset timer for next response
                        response_start_time = time.time()

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
                                    
                                    await safe_send_json(websocket, {
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
                                    
                                    await safe_send_json(websocket, {
                                        "type": "behavioral_question",
                                        "question": q_text,
                                        "audio": q_audio,
                                        "timeLimit": question.get("timeLimit", 2)
                                    })
                                    logger.info("Behavioral question sent")
                            
                            elif section.get("type") == "closing":
                                closing_text = section.get("content", "Thank you for the interview!")
                                closing_audio = generate_speech(closing_text)
                                
                                await safe_send_json(websocket, {
                                    "type": "interview_closing",
                                    "text": closing_text,
                                    "audio": closing_audio
                                })
                                logger.info("Interview closing sent")
                        else:
                            # Interview complete
                            await safe_send_json(websocket, {
                                "type": "interview_complete",
                                "message": "Interview completed! Your responses will be reviewed by our AI system."
                            })
                            session_manager.end_session(session_id)
                            try:
                                await websocket.close()
                            except:
                                pass
                            break

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
                        
                        await safe_send_json(websocket, {
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
                            await safe_send_json(websocket, {
                                "type": "execution_result",
                                "error": result["error"]
                            })
                        else:
                            await safe_send_json(websocket, {
                                "type": "execution_result",
                                "output": result.get("output", ""),
                                "memory": result.get("memory", 0),
                                "cpuTime": result.get("cpuTime", 0)
                            })

                    elif msg_type == "proctor_violation":
                        violation_type = message.get("violation_type", "unknown")
                        violation_result = interview_service.add_violation(session_id, violation_type)
                        
                        await safe_send_json(websocket, violation_result)
                        
                        # If interview terminated due to violations
                        if violation_result.get("type") == "interview_terminated":
                            await websocket.close()
                            break
                    
                    elif msg_type == "audio_data":
                        # Handle real-time audio transcription
                        try:
                            audio_data = base64.b64decode(message.get("audio", ""))
                            transcribed_text = transcribe_audio(audio_data)
                            
                            if transcribed_text:
                                await safe_send_json(websocket, {
                                    "type": "transcription",
                                    "text": transcribed_text
                                })
                        except Exception as audio_error:
                            logger.error(f"Audio processing error: {audio_error}")
                    
                    elif msg_type == "pause_detected":
                        # Handle pause in candidate speech
                        pause_duration = message.get("duration", 0)
                        if pause_duration > 3:  # 3 seconds pause
                            await safe_send_json(websocket, {
                                "type": "prompt_continue",
                                "message": "Please continue with your answer or let me know if you're ready for the next question."
                            })
                    
                    elif msg_type == "face_verification":
                        # Handle face verification data
                        face_data = message.get("face_data")
                        # TODO: Implement face verification against profile picture
                        await safe_send_json(websocket, {
                            "type": "face_verification_result",
                            "verified": True  # Simplified for now
                        })

                    else:
                        await safe_send_json(websocket, {"type": "error", "message": "unsupported message type"})

                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected during message loop: {session_id}")
                    break
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received from client")
                    await safe_send_json(websocket, {"type": "error", "message": "Invalid JSON format"})
                except Exception as msg_error:
                    logger.error(f"Error processing message: {str(msg_error)}", exc_info=True)
                    await safe_send_json(websocket, {"type": "error", "message": f"Processing error: {str(msg_error)}"})


        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected: {session_id}")
            # End interview session and save results
            interview_service.end_session(session_id)
        except Exception as e:
            logger.error(f"Error in websocket loop: {str(e)}", exc_info=True)
            # Only try to send error if connection is still open
            try:
                await safe_send_json(websocket, {"type": "error", "message": str(e)})
                await websocket.close()
            except Exception as close_error:
                logger.error(f"Error closing websocket: {str(close_error)}")
            finally:
                interview_service.end_session(session_id)
    
    except Exception as e:
        logger.error(f"Unexpected error in websocket handler: {str(e)}", exc_info=True)
        # Try to close connection gracefully
        try:
            await websocket.close()
        except Exception as close_error:
            logger.error(f"Error closing websocket in outer handler: {str(close_error)}")
        finally:
            interview_service.end_session(session_id)