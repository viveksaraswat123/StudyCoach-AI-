import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key securely
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables.")

# Configure Gemini
genai.configure(api_key=api_key)

# Initialize Gemini model
model = genai.GenerativeModel("models/gemini-2.5-flash")


def generate_assessment_questions(topic: str, notes: str = "") -> str:
    """
    Generate 5 structured assessment questions from basic to expert level.
    """

    prompt = f"""
You are an expert instructor.

Topic just studied:
{topic}

Studied Topic Details:
{notes}

Task:
Generate 5 high-quality assessment questions that evaluate deep understanding,
progressing from basic to expert difficulty.

Difficulty Levels:
1. Basic conceptual understanding
2. Intermediate understanding
3. Applied reasoning
4. Advanced analysis
5. Expert-level or edge-case reasoning

Requirements:
- Each question must require explanation or reasoning.
- Avoid definitions, trivia, or yes/no questions.
- Avoid multiple-choice formats.
- Focus on "why", "how", or "what would happen if".
- Each answer should ideally require 3-10 sentences.

Output Format:
Return ONLY a numbered list (1-5).
Do not include explanations, headings, or extra commentary.
Ensure the formatting is clean and Markdown-friendly.
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        return f"Error generating questions: {str(e)}"
