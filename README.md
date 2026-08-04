# StudyCoach AI

> A full-stack study platform that combines AI-generated assessments, spaced repetition, focus timers, and gamification — built because most study apps track time but never check if you actually learned anything.

**[Live Demo](https://study-coach-ai-ashen.vercel.app)** · [Backend API Docs](https://study-coach-ai-ashen.vercel.app/docs)

---

## What it does

StudyCoach is not a note-taking app or a simple tracker. It covers the full study cycle:

| Feature | What it does |
|---|---|
| **Study Logs** | Log sessions by topic, duration, and focus level. Track status from In Progress to Completed. |
| **AI Assessments** | When you mark a topic ready, Gemini generates conceptual, application, and scenario-based questions. Answers are AI-evaluated with feedback and weak-topic detection. |
| **Focus Timer** | Built-in Pomodoro timer with 25-minute work blocks, short and long breaks, and automatic session logging. |
| **Flashcard Decks** | Create decks, add cards, and study with SM-2 spaced repetition — cards are scheduled based on how well you know them. |
| **Study Groups** | Join or create groups, climb XP leaderboards, and stay accountable with peers. |
| **Performance Charts** | Weekly study hours, focus breakdown, accuracy trends, and top subjects — all visualised on a dashboard. |
| **Task Board** | Kanban-style board to organise assignments and study tasks from To Do to Done. |
| **Gamification** | XP earned per session, consistency streaks, and badges for milestones. |

---

## Tech Stack

**Backend**
- FastAPI (Python) — async REST API
- PostgreSQL + SQLAlchemy ORM
- Alembic — database migrations
- JWT Authentication (bcrypt password hashing)
- Gemini API — AI question generation and answer evaluation

**Frontend**
- React.js
- Tailwind CSS
- Recharts — performance visualisation

**Infrastructure**
- Docker — containerised backend
- Vercel — frontend deployment
- Alembic migrations for schema versioning

---

## Architecture

The app follows a clean 3-layer architecture:

```
Client (React)
    │
    ▼
FastAPI Routes (HTTP + JWT middleware)
    │
    ├── Auth Service      → register, login, token validation
    ├── Study Service     → logs, sessions, streaks
    ├── AI Service        → Gemini prompt construction, response parsing
    ├── Flashcard Service → SM-2 algorithm, deck management
    └── Analytics Service → aggregation queries, chart data
    │
    ▼
PostgreSQL (via SQLAlchemy)
```

AI flow: user marks topic ready → FastAPI builds a structured prompt → Gemini API returns JSON questions → stored in PostgreSQL → on answer submission, Gemini evaluates response → score + feedback returned to frontend.

---

## Database Schema

| Table | Key Fields |
|---|---|
| `users` | id, email, password_hash, xp, streak |
| `study_logs` | user_id, topic, hours, focus_level, status |
| `test_sessions` | user_id, topic, difficulty, score |
| `questions` | session_id, question_text, type, difficulty |
| `attempts` | user_id, question_id, answer_text, score, feedback |
| `flashcard_decks` | user_id, title, card_count |
| `flashcards` | deck_id, front, back, sm2_interval, sm2_easiness |
| `study_groups` | id, name, created_by, member_count |
| `badges` | title, criteria, icon |

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend

```bash
git clone https://github.com/viveksaraswat123/StudyCoach-AI-
cd StudyCoach-AI-

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` in the root:

```env
DATABASE_URL=postgresql://username:password@localhost/study_db
SECRET_KEY=your_secret_key
GOOGLE_API_KEY=your_gemini_api_key
```

```bash
alembic upgrade head      # run migrations
uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd study-platform-frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

---

## Roadmap

- [x] User auth + study logging
- [x] AI question generation and answer evaluation
- [x] Pomodoro focus timer with session logging
- [x] SM-2 spaced repetition flashcards
- [x] Study groups with XP leaderboards
- [x] Performance charts and analytics dashboard
- [x] Kanban task board
- [x] Gamification (XP, streaks, badges)
- [x] Docker deployment
- [ ] Voice-based answer input (Web Speech API)
- [ ] Hindi / Hinglish language support
- [ ] Adaptive difficulty based on past performance
- [ ] Mobile app (React Native)

---

## Why I built this

I wanted a project that wasn't just a CRUD app. Most study tools track time — they don't close the loop on whether you actually understood anything. The AI assessment feature is the core: study → mark ready → get tested → see where you're weak → study that again. That feedback loop is what the app is built around.

The broader goal was to build something I'd actually use, and to practice full-stack development, AI integration, database design, and product thinking in one project.

---

## Contact

**Vivek Saraswat** — Backend Developer & AI Engineer  
[LinkedIn](https://www.linkedin.com/in/saraswat-vivek/) · [GitHub](https://github.com/viveksaraswat123) · viveksaraswat361@gmail.com