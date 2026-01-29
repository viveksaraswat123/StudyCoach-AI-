import google.generativeai as genai
import os
from dotenv import load_dotenv

#Load variables from .env
load_dotenv()

#Read API key from environment
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

# Configure Gemini
genai.configure(api_key=api_key)

#Load model
try:
    model = genai.GenerativeModel("gemini-1.5-flash-002")
except Exception:
    model = genai.GenerativeModel("models/gemini-1.5-flash")


def generate_assessment_questions(topic: str, notes: str = ""):
    prompt = f"""
You are an expert instructor.

Topic just studied:
{topic}

Student notes (context, may be incomplete):
{notes}

Task:
Generate 5 open-ended questions that assess the student's understanding of the topic,
progressing from basic to advanced difficulty.

Difficulty levels:
1. Basic conceptual understanding
2. Intermediate understanding
3. Applied reasoning
4. Advanced analysis
5. Expert-level or edge-case reasoning

Requirements:
- Each question must require explanation or reasoning.
- Avoid definitions, trivia, or yes/no questions.
- Avoid multiple-choice formats.
- Questions should focus on "why", "how", or "what would happen if".
- Each question should be answerable in 3-10 sentences.

Output format:
Return ONLY a numbered list (1-5) of the questions.
Do not include explanations, headings, or extra text.
"""

    response = model.generate_content(prompt)
    return response.text.strip()
