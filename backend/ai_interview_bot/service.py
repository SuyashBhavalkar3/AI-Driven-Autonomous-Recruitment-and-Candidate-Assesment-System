import base64
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def handle_audio_message(audio_base64: str, conversation: list):

    audio_bytes = base64.b64decode(audio_base64)

    with open("temp.wav", "wb") as f:
        f.write(audio_bytes)

    # 1️⃣ Speech-to-Text
    with open("temp.wav", "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )

    user_text = transcript.text

    conversation.append({"role": "user", "content": user_text})

    # 2️⃣ LLM Recruiter Mode Prompt
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

    conversation.append({"role": "assistant", "content": ai_text})

    # 3️⃣ Convert to Speech
    speech = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        input=ai_text
    )

    audio_response = base64.b64encode(
        speech.read()
    ).decode("utf-8")

    return {
        "type": "ai_response",
        "text": ai_text,
        "audio": audio_response
    }