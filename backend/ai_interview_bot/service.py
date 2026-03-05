import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# configure OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def evaluate_response(session: dict) -> str:
    """Use the LLM to decide the next question given the current session state.

    Session transcript entries should contain speaker and message.  This function
    builds a chat conversation for the model, instructs it to behave like a
    recruiter, and returns the assistant's next utterance.
    """
    # prepare conversation messages based on transcript history
    messages = []
    system_prompt = (
        "You are a professional technical recruiter conducting an interview. "
        "Based on the candidate's previous answers, either ask a follow-up question "
        "or move the conversation forward to the next stage. Only one question or "
        "comment should be provided at a time. Do not provide code or explanations unless asked."
    )
    messages.append({"role": "system", "content": system_prompt})

    for entry in session.get("transcript", []):
        role = "assistant" if entry["speaker"] == "bot" else "user"
        messages.append({"role": role, "content": entry["message"]})

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"[LLM evaluate error] {e}")
        return "I'm sorry, I encountered an error and cannot continue the interview."