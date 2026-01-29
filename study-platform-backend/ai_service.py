import google.generativeai as genai
import os

# Set up your API Key (Get one from Google AI Studio)
genai.configure(api_key="AIzaSyBRY7MugIhRYIt3vmZ-OpE2uEXaPz2L4hQ")

# Option A: Try the latest stable identifier
# Option B: Use gemini-1.5-flash-latest if the standard one 404s
try:
    model = genai.GenerativeModel("gemini-1.5-flash-002")

except:
    model = genai.GenerativeModel('models/gemini-1.5-flash')

def generate_assessment_question(topic: str, notes: str = ""):
    prompt = f"""
    The student just studied: {topic}. 
    Additional context from notes: {notes}.
    
    Generate ONE challenging open-ended question to test their conceptual understanding.
    """
    
    # Explicitly using the content generation
    response = model.generate_content(prompt)
    return response.text