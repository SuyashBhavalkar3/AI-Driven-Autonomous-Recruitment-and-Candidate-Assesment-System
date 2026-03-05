from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import base64
from .services.interview_session import SessionManager
from .services.code_executor import execute_code
from .services.proctoring import log_violation
from .services.sarvam_service import transcribe_audio, generate_speech
from .service import evaluate_response

router = APIRouter()

session_manager = SessionManager()

@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = session_manager.create_session(session_id)

    # generate the first question and send it
    first_question = evaluate_response(session)
    session_manager.add_transcript(session_id, "bot", first_question)
    session_manager.update_last_question(session_id, first_question)
    first_audio = generate_speech(first_question)
    await websocket.send_json({
        "type": "interviewer_question",
        "text": first_question,
        "audio": first_audio
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "candidate_audio":
                audio_b64 = message.get("audio", "")
                try:
                    audio_bytes = base64.b64decode(audio_b64)
                except Exception:
                    audio_bytes = b""
                candidate_text = transcribe_audio(audio_bytes)
                session_manager.add_transcript(session_id, "candidate", candidate_text)
                session_manager.add_candidate_response(session_id, candidate_text)

                # determine next question
                next_question = evaluate_response(session_manager.get_session(session_id))
                session_manager.add_transcript(session_id, "bot", next_question)
                session_manager.update_last_question(session_id, next_question)
                q_audio = generate_speech(next_question)
                await websocket.send_json({
                    "type": "interviewer_question",
                    "text": next_question,
                    "audio": q_audio
                })

            elif msg_type == "run_code":
                code = message.get("code", "")
                language = message.get("language", "python3")
                versionIndex = message.get("versionIndex", "4")
                result = execute_code(code, language, versionIndex)
                if "error" in result:
                    await websocket.send_json({"type": "execution_result", "error": result["error"]})
                else:
                    await websocket.send_json({
                        "type": "execution_result",
                        "output": result["output"],
                        "memory": result["memory"],
                        "cpuTime": result["cpuTime"]
                    })

            elif msg_type == "proctor_event":
                log_violation(session_id, message.get("event"), session_manager)

            else:
                await websocket.send_json({"type": "error", "message": "unsupported message type"})

    except WebSocketDisconnect:
        session_manager.end_session(session_id)