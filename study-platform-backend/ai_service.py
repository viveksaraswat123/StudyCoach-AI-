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

def generate_tutor_response(topic: str, question: str) -> str:
    """
    Generate a helpful tutor response to a student's question using Socratic method.
    Returns well-formatted response with examples and clear structure.
    """
    
    prompt = f"""
You are an exceptional AI tutor helping a student deeply understand {topic}.

Student's Question About "{topic}":
{question}

Your Response Strategy:
1. Start with a brief, clear answer (1-2 sentences)
2. Provide a detailed explanation with structured steps
3. Include 2-3 concrete examples or analogies
4. Highlight key concepts and relationships
5. End with a thought-provoking follow-up question
6. Use markdown formatting for clarity

Response Structure (use markdown):
- Use **bold** for key terms
- Use bullet points for lists and steps
- Use > for important notes
- Use code blocks (```...```) if showing code or formulas
- Use headings (##) to organize sections

Guidelines:
- Be conversational and encouraging
- Explain WHY concepts matter, not just WHAT they are
- Break complex ideas into digestible parts
- Connect new ideas to things they might already know
- Keep language clear - avoid unnecessary jargon
- Format with good visual hierarchy using markdown

Provide your response in a way that's easy to read and understand:
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"I apologize, I encountered an error: {str(e)}. Please try asking your question again."