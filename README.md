# 📚 StudyCoach AI - AI-Powered Study Tracking & Assessment Platform

StudyCoach AI is a web-based platform that helps students stay consistent, track their study hours, and validate learning through AI-generated topic-wise tests.

Users log what they studied and for how long, and the system generates a Question–Answer test **only when the user clicks _"Task Completed"_ or _"Ready for Test"_**.  
The platform then evaluates the answers (typed or spoken), provides feedback, and tracks progress using dashboards, streaks, points, and badges.

---

## 🚀 Key Features

### ✅ Study Tracking
- Log **daily study hours**
- Log **topics studied**
- Track logs as **In Progress → Completed**
- Generate test only after **Ready for Test** click

### ✅ AI-Powered Q&A Sessions
- Automatically generates topic-based questions like:
  - MCQs
  - Short answers
  - Concept-based questions
  - Viva / interview-style questions
  - Scenario-based questions

### ✅ Answering Modes
- ✍️ **Text-based answers**
- 🎙️ **Voice answers (Speech → Text)** *(planned feature / optional)*  
- Supports answering in **any language** (English / Hindi / Hinglish etc.)

### ✅ Smart Evaluation + Feedback
- Score for each question
- Accuracy %
- Correct answer + explanation
- Improvement suggestions
- Weak topics detection

### ✅ Dashboard Analytics
- Total study hours
- Daily / weekly study trends
- Consistency streak tracking
- Test performance analytics
- Accuracy improvement trends

### ✅ Gamification (Motivation System)
- Consistency points
- Badges for milestones
- Levels based on progress

---

## 🧠 Why This Project?

Most study apps only track time. StudyCoach AI does more:

✅ Tracks study habits  
✅ Generates real topic-based Q&A  
✅ Evaluates learning with feedback  
✅ Builds consistency with streaks + badges  

This makes it a complete **study + assessment + progress tracking system**.

---

## 📌 Workflow

### 1) Log Study
User enters:
- Study hours
- Topic studied

Saved as: **In Progress**

### 2) Complete Study Task
User clicks:
✅ **Task Completed** / ✅ **Ready for Test**

Status becomes: **Completed**

### 3) Generate Test
System generates a topic-wise test session.

### 4) Submit Answers
User answers via:
- Text (currently)
- Voice (optional / future)

### 5) Evaluation + Dashboard Update
System evaluates answers and updates:
- accuracy
- score history
- badges
- streak
- total hours

---

## 🏗️ Tech Stack (Planned)

### Frontend
- React.js *(recommended)*
- Tailwind CSS / Bootstrap

### Backend
- FastAPI *(recommended)* / Django

### Database
- PostgreSQL / SQLite (for development)

### AI Integration
- LLM API (OpenAI or any compatible model)

### Voice Input (Optional)
- Web Speech API (Speech Recognition)

---

## 🗃️ Database Design (High-Level)

### Users
- `id`, `name`, `email`, `password_hash`, `created_at`

### StudyLogs
- `id`, `user_id`, `topic`, `hours`, `date`, `status`, `completed_at`

### TestSessions
- `id`, `user_id`, `topic`, `difficulty`, `created_at`

### Questions
- `id`, `session_id`, `question_text`, `question_type`

### Attempts
- `id`, `user_id`, `session_id`, `question_id`, `answer_text`, `score`, `feedback`

### Badges
- `id`, `title`, `criteria`

### UserBadges
- `user_id`, `badge_id`, `earned_at`

---

## 📊 Dashboard Metrics (Planned)

- Total study hours
- Study streak (current & best)
- Weekly consistency graph
- Total tests taken
- Overall accuracy %
- Improvement trend
- Weak topics list
- Badges earned

---

## ✅ Project Roadmap

### Phase 1 — Core MVP
- [ ] User authentication
- [ ] Study logging
- [ ] Task completion button
- [ ] Generate Q&A session
- [ ] Answer submission (text)
- [ ] Store results

### Phase 2 — Analytics & Gamification
- [ ] Dashboard graphs
- [ ] Streak system
- [ ] Points & badges

### Phase 3 — Voice + Advanced Evaluation
- [ ] Voice answer support
- [ ] Multi-language evaluation improvements
- [ ] Topic strength/weakness detection

---

## 🛠️ How to Run (Placeholder)
This section will be updated once development starts.

```bash
# Clone repository
git clone https://github.com/your-username/studycoach-ai.git

# Go to project folder
cd studycoach-ai
