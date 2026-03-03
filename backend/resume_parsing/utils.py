import os
import json
from groq import Groq
from pdfminer.high_level import extract_text as extract_pdf_text
from docx import Document
from resume_parsing.prompt import PARSING_PROMPT
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq()


def extract_text(file_stream, filename: str):
    extension = filename.split(".")[-1].lower()

    if extension == "pdf":
        # example using pdfminer
        from pdfminer.high_level import extract_text
        text = extract_text(file_stream)

    elif extension in ["doc", "docx"]:
        # handle word file
        text = "doc parsing logic"

    else:
        raise ValueError("Unsupported file format")

    return text

def parse_resume_with_groq(resume_text):
    full_prompt = f"{PARSING_PROMPT}\n\n{resume_text}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert AI resume parser that extracts structured JSON."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ],
        temperature=0
    )

    result = response.choices[0].message.content.strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON returned",
            "raw_output": result
        }
    
def parse_resume(file,file_path):
    text = extract_text(file,file_path)
    return parse_resume_with_groq(text)