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


def generate_card_suggestion(title: str = "", description: str = "", due_date: str | None = None) -> dict:
    """
    Suggest a better title, priority (1 high - 5 low), and short notes for a kanban card.
    Returns a dict compatible with KanbanSuggestionResponse.
    """
    prompt = f"""
You are an expert productivity assistant.

Given a task title and optional description and due date, suggest:
- a concise, clearer title (1-8 words)
- a priority integer from 1 (highest) to 5 (lowest)
- one short note to help the user act on it immediately

Task Title: {title}
Description: {description}
Due Date: {due_date}

Return results in JSON with keys: suggested_title, suggested_priority, suggested_notes.
Do not add extra commentary.
"""
    try:
        resp = model.generate_content(prompt)
        text = resp.text.strip()
        # naive parse: try to extract JSON, otherwise fallback to plain parsing
        import json, re
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            payload = json.loads(m.group(0))
            return payload
        # fallback: split lines
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        suggested_title = lines[0] if lines else title
        suggested_priority = 3
        suggested_notes = ""
        for ln in lines:
            if "priority" in ln.lower():
                import re
                d = re.findall(r"\d", ln)
                if d:
                    suggested_priority = int(d[0])
            if "note" in ln.lower() or "notes" in ln.lower():
                suggested_notes = ln.split(":", 1)[-1].strip()

        return {
            "suggested_title": suggested_title,
            "suggested_priority": suggested_priority,
            "suggested_notes": suggested_notes,
        }
    except Exception as e:
        return {"suggested_title": title or "Suggested Task", "suggested_priority": 3, "suggested_notes": f"(error: {str(e)})"}