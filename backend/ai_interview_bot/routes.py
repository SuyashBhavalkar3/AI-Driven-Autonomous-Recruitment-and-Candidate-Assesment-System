from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .service import handle_audio_message, stream_tts_audio
from openai import OpenAI
import os
import base64
import json

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.websocket("/ws/interview")
async def interview_socket(websocket: WebSocket):
    await websocket.accept()

    conversation = []

    # Initial greeting
    greeting_text = """Hello, welcome to the Software Engineer 1 interview.
I will be your interviewer today.
To begin, could you please introduce yourself?"""

    try:
        # Get speech from Sarvam API using streaming
        try:
            audio_response = stream_tts_audio(greeting_text)
        except Exception as e:
            print(f"TTS failed for greeting: {e}")
            audio_response = ""

        await websocket.send_json({
            "type": "ai_response",
            "text": greeting_text,
            "audio": audio_response
        })

        conversation.append({"role": "assistant", "content": greeting_text})

        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "text":
                # User sent text directly (from STT or manual input)
                user_text = data.get("text", "").strip()
                if not user_text:
                    await websocket.send_json({"type":"error","message":"empty text"})
                    continue
                
                conversation.append({"role": "user", "content": user_text})
                
                # Get LLM response
                system_prompt = """You are a professional technical recruiter interviewing a candidate for Software Engineer 1 role.
Interview Flow:
1. Ask for introduction.
2. Ask 2 DSA questions (focus on approach and optimization).
3. Ask 2 behavioral questions.
4. End interview professionally.

Act like a real recruiter.
Be conversational.
Do not reveal scoring.
Ask only ONE question at a time."""

                messages = [{"role": "system", "content": system_prompt}] + conversation
                
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages
                )

                ai_text = completion.choices[0].message.content
                conversation.append({"role": "assistant", "content": ai_text})
                
                # Convert to speech using Sarvam API with streaming
                try:
                    audio_response = stream_tts_audio(ai_text)
                except Exception as e:
                    print(f"TTS failed for response: {e}")
                    audio_response = ""

                await websocket.send_json({
                    "type": "ai_response",
                    "text": ai_text,
                    "audio": audio_response
                })
                
            elif data.get("type") == "audio":
                # User sent audio (recorded speech)
                response = await handle_audio_message(
                    audio_base64=data.get("audio"),
                    conversation=conversation
                )
                await websocket.send_json(response)
            else:
                await websocket.send_json({"type":"error","message":"unsupported message type"})
    except WebSocketDisconnect:
        return
    except Exception as e:
        try:
            await websocket.send_json({"type":"error","message":str(e)})
        except:
            pass
        return


@router.websocket("/ws/audio-roundtrip")
async def audio_roundtrip(websocket: WebSocket):
    """Simple echo websocket for audio roundtrip testing.
    Expects JSON messages like: {"type":"audio","data":"<base64>","mime":"audio/webm"}
    Replies with the same structure: {"type":"audio","data":"<base64>","mime":"..."}
    Also supports {"type":"text","text":"..."} and will echo back.
    """
    await websocket.accept()
    await websocket.send_json({"type":"text","text":"audio-roundtrip ready"})
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                obj = json.loads(raw)
            except Exception:
                await websocket.send_json({"type":"text","text":"invalid json"})
                continue

            if obj.get("type") == "audio":
                # echo the audio payload back
                await websocket.send_json({"type":"audio","data": obj.get("data"), "mime": obj.get("mime", "audio/webm")})
            elif obj.get("type") == "text":
                await websocket.send_json({"type":"text","text": f"echo: {obj.get('text')}"})
            else:
                await websocket.send_json({"type":"text","text":"unknown type"})
    except WebSocketDisconnect:
        return