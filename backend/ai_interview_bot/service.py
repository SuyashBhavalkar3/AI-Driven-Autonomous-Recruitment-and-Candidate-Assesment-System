import base64
import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
sarvam_api_key = os.getenv("SARVAM_API_KEY")

# streaming endpoint returns raw MP3 bytes (see sarvam_payload.md example)
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech/stream"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

# fallback base64 for a tiny sample MP3 (1-word TTS) used when no API key is configured
# generated using gtts if you need to refresh it.
DUMMY_AUDIO_B64 = (
"//OExAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
)


def stream_tts_audio(text: str) -> str:
    """
    Convert text to speech using Sarvam API.
    Returns base64 encoded MP3 audio.
    """

    # if caller forgot to configure the Sarvam key we can still test flows
    if not text:
        raise ValueError("Text is required")

    if not sarvam_api_key or sarvam_api_key.lower() in ("", "test"):
        print("[TTS] No Sarvam API key configured, returning dummy audio for testing")
        return DUMMY_AUDIO_B64

    headers = {
        "api-subscription-key": sarvam_api_key,
        "Content-Type": "application/json"
    }

    payload = {
        # payload structure copied from `sarvam_payload.md` reference
        "text": text,
        "target_language_code": "en-IN",
        "speaker": "priya",
        "model": "bulbul:v3",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",
        "enable_preprocessing": True
    }

    print(f"[TTS] Requesting audio for: {text[:60]}...")

    try:
        # use streaming to avoid loading huge files into memory (though small here)
        with requests.post(
            SARVAM_TTS_URL,
            headers=headers,
            json=payload,
            stream=True,
            timeout=30
        ) as response:
            print(f"[TTS] Status: {response.status_code}")
            response.raise_for_status()

            # read all chunks into bytes
            chunks = []
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    chunks.append(chunk)
            audio_bytes = b"".join(chunks)

        if not audio_bytes:
            raise ValueError("No audio bytes returned from Sarvam")

        # debug: log file header and check for MP3 signature
        preview = audio_bytes[:10]
        print(f"[TTS] First bytes: {preview}")
        if not (audio_bytes.startswith(b'\xff\xfb') or audio_bytes.startswith(b'ID3')):
            print("[TTS] WARNING: data does not look like MP3 (missing header)")
        # encode the binary into base64 so the frontend can consume it
        audio_base64 = base64.b64encode(audio_bytes).decode("ascii")
        print(f"[TTS] Returned {len(audio_bytes)} bytes -> {len(audio_base64)} base64 chars")
        return audio_base64

    except requests.exceptions.RequestException as e:
        print(f"[TTS] Request failed: {e}")
        raise ValueError(f"Sarvam API request failed: {str(e)}")

    except Exception as e:
        print(f"[TTS] Processing error: {e}")
        raise ValueError(f"TTS processing failed: {str(e)}")


async def handle_audio_message(audio_base64: str, conversation: list):
    """
    Handles user audio input:
    1. Decode base64 audio
    2. Send to Sarvam STT
    3. Send transcript to GPT
    4. Convert GPT response to speech
    """

    try:
        # Decode browser audio
        audio_bytes = base64.b64decode(audio_base64)
        print(f"[STT] Received audio bytes: {len(audio_bytes)}")

        # Send audio to Sarvam STT (multipart/form-data)
        files = {
            "file": ("audio.webm", audio_bytes, "audio/webm")
        }

        # some endpoints expect additional form fields; include defaults from example
        data = {
            "model": "saaras:v3",
            "mode": "transcribe",
            # language_code could be 'unknown' to auto-detect
            "language_code": "unknown"
        }

        headers = {
            "api-subscription-key": sarvam_api_key
        }

        response = requests.post(
            SARVAM_STT_URL,
            files=files,
            data=data,
            headers=headers
        )

        print(f"[STT] Status: {response.status_code}")
        response.raise_for_status()

        transcript_data = response.json()
        # some Sarvam responses embed the result under different keys
        user_text = ""
        if isinstance(transcript_data, dict):
            # common fields seen in docs: "transcript", "text", or nested results
            user_text = transcript_data.get("transcript") or transcript_data.get("text") or ""
            if not user_text:
                # try deeper lookup
                if "results" in transcript_data:
                    # could be list of segments
                    results = transcript_data["results"]
                    if isinstance(results, list) and results:
                        user_text = results[0].get("transcript") or results[0].get("text", "")
        user_text = user_text.strip()

        print(f"[STT] Transcript: {user_text}")

        if not user_text:
            return {
                "type": "error",
                "message": "Could not transcribe audio"
            }

        conversation.append({
            "role": "user",
            "content": user_text
        })

        # LLM Interviewer prompt
        system_prompt = """
You are a professional technical recruiter interviewing a candidate
for Software Engineer 1 role.

Interview Flow:
1. Ask for introduction.
2. Ask 2 DSA questions (focus on approach and optimization).
3. Ask 2 behavioral questions.
4. End interview professionally.

Act like a real recruiter.
Be conversational.
Do not reveal scoring.
Ask only ONE question at a time.
"""

        messages = [{"role": "system", "content": system_prompt}] + conversation

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        ai_text = completion.choices[0].message.content

        conversation.append({
            "role": "assistant",
            "content": ai_text
        })

        print(f"[LLM] Response: {ai_text[:80]}...")

        # Convert AI response to speech
        audio_response = stream_tts_audio(ai_text)

        return {
            "type": "ai_response",
            "text": ai_text,
            "audio": audio_response
        }

    except Exception as e:
        print(f"[ERROR] {e}")

        return {
            "type": "error",
            "message": str(e)
        }