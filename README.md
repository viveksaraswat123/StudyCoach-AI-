# StudyCoach AI

A full-stack web app that helps students study smarter - not just track hours, but actually test and improve their understanding through AI-generated assessments.

> Built as a personal project during my final year of B.Tech (CS - Data Science). The idea came from a simple frustration: most study apps just track time but never check if you actually *learned* anything.

---

## What it does

1. You log a topic and how long you studied it
2. When you feel ready, click **"Ready for Test"**
3. The app generates topic-specific questions (conceptual, application, scenario-based, etc.)
4. You answer them, and the AI evaluates your responses
5. You get a score, feedback, and weak topic detection

That's it. Simple loop — study → test → improve.

---

## Tech Stack

**Backend**
- FastAPI
- PostgreSQL + SQLAlchemy
- JWT Authentication (bcrypt for password hashing)

**Frontend**
- React.js
- Tailwind CSS / Bootstrap

**AI**
- Gemini API (OpenAI-compatible LLM integration)

---

## Project Structure

```
studycoach-ai/
├── app/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── database.py
│   └── ai_service.py
├── studycoach-frontend/
├── .env
├── requirements.txt
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
git clone https://github.com/viveksaraswat123/StudyCoach-AI-
cd studycoach-ai

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://username:password@localhost/study_db
SECRET_KEY=your_secret_key
GOOGLE_API_KEY=your_gemini_api_key
```

```bash
uvicorn app.main:app --reload
```

API runs at `http://127.0.0.1:8000`  
Swagger docs at `http://127.0.0.1:8000/docs`

### Frontend Setup

```bash
cd studycoach-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Database Schema (simplified)

| Table | Key Fields |
|---|---|
| `users` | id, email, password_hash |
| `study_logs` | user_id, topic, hours, status |
| `test_sessions` | user_id, topic, difficulty |
| `questions` | session_id, question_text, type |
| `attempts` | user_id, question_id, answer_text, score |
| `badges` | title, criteria |

---

## Features

- **Study Logging** — log topics and hours, track status (In Progress → Completed)
- **AI Assessment** — auto-generates questions with difficulty progression
- **Answer Evaluation** — scores answers, gives feedback, detects weak topics
- **Dashboard** — study streaks, accuracy trends, test history
- **Gamification** — badges and consistency points

---

## Roadmap

- [x] User auth + study logging
- [x] AI question generation
- [x] Answer submission + evaluation
- [x] Dashboard analytics + streaks
- [ ] Voice-based answer input (Web Speech API)
- [ ] Hindi / Hinglish language support
- [ ] Adaptive difficulty based on past performance
- [ ] Docker deployment

---

## Why I built this

I wanted a project that wasn't just a CRUD app. This combines backend dev, AI integration, and real product thinking - something I could actually use myself while preparing for placements.

---

## Contact

**Vivek Saraswat**  
[LinkedIn](https://www.linkedin.com/in/saraswat-vivek/) · [GitHub](https://github.com/viveksaraswat123) · viveksaraswat361@gmail.com