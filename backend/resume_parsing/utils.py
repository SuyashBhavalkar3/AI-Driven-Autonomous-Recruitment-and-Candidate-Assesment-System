import os
import json
from openai import OpenAI
from pdfminer.high_level import extract_text as extract_pdf_text
from docx import Document
from resume_parsing.prompt import PARSING_PROMPT

# Load OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_text(file_stream, filename: str):
    extension = filename.split(".")[-1].lower()

    if extension == "pdf":
        text = extract_pdf_text(file_stream)

    elif extension in ["doc", "docx"]:
        doc = Document(file_stream)
        text = "\n".join([p.text for p in doc.paragraphs])

    else:
        raise ValueError("Unsupported file format")

    return text


def parse_resume_with_openai(resume_text):
    full_prompt = f"{PARSING_PROMPT}\n\n{resume_text}"

    response = client.chat.completions.create(
        model="gpt-4o-mini",   # fast + cheap
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


def parse_resume(file, file_path):
    text = extract_text(file, file_path)
    return parse_resume_with_openai(text)