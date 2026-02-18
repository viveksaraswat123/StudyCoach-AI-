# 📚 StudyCoach AI  
### AI-Powered Study Tracking & Assessment Platform

StudyCoach AI is a full-stack web platform designed to help students build consistency, validate learning, and improve performance using AI-generated assessments.

Instead of only tracking study time, StudyCoach AI ensures that learning is tested, evaluated, and improved through structured topic-based assessments and smart analytics.

---

## 🚀 Core Features

### 📖 Study Tracking
- Log daily study hours
- Log topics studied
- Mark tasks as **In Progress → Completed**
- Generate test only after clicking **Ready for Test**

### 🤖 AI-Powered Assessment
- Automatically generates topic-based questions
- Difficulty progression (basic → advanced)
- Question types:
  - Conceptual
  - Application-based
  - Analytical
  - Scenario-based
  - Viva-style

### ✍️ Answer Submission
- Text-based answers (current)
- Voice-based answers (planned)
- Multi-language support (English / Hindi / Hinglish)

### 📊 Smart Evaluation
- Score per question
- Accuracy percentage
- Correct answers with explanations
- Feedback and improvement suggestions
- Weak topic detection

### 📈 Dashboard & Analytics
- Total study hours
- Study streak (current & best)
- Weekly trends
- Accuracy trends
- Test history
- Improvement tracking

### 🏆 Gamification System
- Consistency points
- Badges for milestones
- Progress levels

---

## 🧠 Problem It Solves

Most study apps only track time.

StudyCoach AI:
- Tracks study behavior
- Tests understanding
- Evaluates answers
- Provides feedback
- Builds long-term consistency

It combines:
**Study Tracking + AI Assessment + Performance Analytics**

---

## 🏗️ Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- bcrypt password hashing

### Frontend
- React.js
- Tailwind CSS / Bootstrap

### AI Integration
- LLM API (Gemini / OpenAI compatible)

### Optional
- Web Speech API (Voice input)

---

## 🗂️ Project Structure

"""
studycoach-ai/
│
├── app/
│ ├── main.py
│ ├── models.py
│ ├── schemas.py
│ ├── auth.py
│ ├── database.py
│ ├── ai_service.py
│
├── studycoach-frontend/
│
├── .env
├── requirements.txt
├── .gitignore
└── README.md
"""


---

## 🗃️ Database Design

### Users
- id
- email
- password_hash
- created_at

### StudyLogs
- id
- user_id
- topic
- hours
- study_date
- status
- completed_at

### TestSessions
- id
- user_id
- topic
- difficulty
- created_at

### Questions
- id
- session_id
- question_text
- question_type

### Attempts
- id
- user_id
- session_id
- question_id
- answer_text
- score
- feedback

### Badges
- id
- title
- criteria

### UserBadges
- user_id
- badge_id
- earned_at

---

## 🔐 Authentication

- JWT-based authentication
- Token expiration handling
- Secure password hashing using bcrypt
- Protected routes using OAuth2 Bearer token

---

## 📌 Workflow

### 1️⃣ Log Study
User logs:
- Topic
- Hours studied

Status: **In Progress**

### 2️⃣ Complete Study
User clicks:
**Ready for Test**

Status becomes: **Completed**

### 3️⃣ Generate Test
System generates topic-based assessment.

### 4️⃣ Submit Answers
User submits answers (text / voice).

### 5️⃣ Evaluation
System evaluates and updates:
- Accuracy
- Score history
- Dashboard metrics
- Streaks
- Badges

---

## 📊 Dashboard Metrics

- Total study hours
- Study streak
- Weekly graph
- Total tests taken
- Overall accuracy %
- Improvement trend
- Weak topic list
- Earned badges

---

## ⚙️ Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/viveksaraswat123/StudyCoach-AI-
cd studycoach-ai

## ⚙️ Backend Setup

```bash
python -m venv venv
```

### Activate Virtual Environment

**Windows**
```bash
venv\Scripts\activate
```

**Mac/Linux**
```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Create `.env` File

```
DATABASE_URL=postgresql://username:password@localhost/study_db
SECRET_KEY=your_secret_key
GOOGLE_API_KEY=your_llm_api_key
```

### Run Server

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

Swagger Docs:

```
http://127.0.0.1:8000/docs
```

---

## 💻 Frontend Setup

```bash
cd studycoach-frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🛣️ Roadmap

### Phase 1 — Core MVP
- User authentication  
- Study logging  
- AI question generation  
- Answer submission  
- Result storage  

### Phase 2 — Analytics
- Graphs  
- Streak system  
- Accuracy tracking  
- Badge logic  

### Phase 3 — Advanced AI
- Voice answer support  
- Multi-language evaluation  
- Topic strength detection  
- Adaptive difficulty  

---

## 🧪 Future Enhancements
- Refresh token system  
- Role-based access control  
- Background AI processing queue  
- Redis caching  
- Docker production deployment  
- CI/CD pipeline  
- Mobile version  
