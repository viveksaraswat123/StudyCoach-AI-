from datetime import datetime, timedelta
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import models
import schemas
import database
import ai_service
import auth
import kanban


app = FastAPI(title="AI Study Platform", version="1.0.0", docs_url="/docs", redoc_url=None)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=database.engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://study-coach-ai-ashen.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

DBSession = Annotated[Session, Depends(database.get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


def get_current_user(token: TokenDep, db: DBSession) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter_by(email=email).first()
    if not user:
        raise credentials_exception

    return user


CurrentUser = Annotated[models.User, Depends(get_current_user)]

app.include_router(kanban.router, prefix="/api/kanban")


@app.post("/api/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, user_data: schemas.UserCreate, db: DBSession):
    existing = db.query(models.User).filter_by(email=user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=user_data.email,
        hashed_password=auth.hash_password(user_data.password),
        created_at=datetime.utcnow(),
        total_xp=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(request: Request, db: DBSession, form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter_by(email=form_data.username).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_profile(current_user: CurrentUser):
    return current_user


@app.patch("/api/users/me", response_model=schemas.UserResponse)
def update_profile(updates: schemas.UserUpdate, db: DBSession, current_user: CurrentUser):
    if updates.email and updates.email != current_user.email:
        already_taken = db.query(models.User).filter_by(email=updates.email).first()
        if already_taken:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = updates.email

    if updates.password:
        current_user.hashed_password = auth.hash_password(updates.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@app.delete("/api/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(db: DBSession, current_user: CurrentUser):
    db.delete(current_user)
    db.commit()


@app.get("/api/users/me/stats")
def get_profile_stats(db: DBSession, current_user: CurrentUser):
    total_hours = db.query(func.sum(models.StudyLog.hours)).filter_by(user_id=current_user.id).scalar() or 0
    total_sessions = db.query(models.StudyLog).filter_by(user_id=current_user.id).count()

    all_logs = (
        db.query(models.StudyLog.study_date)
        .filter_by(user_id=current_user.id)
        .order_by(models.StudyLog.study_date.desc())
        .all()
    )

    streak = 0
    today = datetime.utcnow().date()
    current_date = today

    for log in all_logs:
        if log.study_date == current_date or log.study_date == current_date - timedelta(days=1):
            streak += 1
            current_date = log.study_date
        else:
            break

    return {
        "streak": streak,
        "total_study_hours": float(total_hours),
        "total_sessions": total_sessions,
        "total_xp": current_user.total_xp or 0,
    }


@app.post("/api/logs", response_model=schemas.StudyLogResponse, status_code=status.HTTP_201_CREATED)
def create_study_log(log: schemas.StudyLogCreate, db: DBSession, current_user: CurrentUser):
    new_log = models.StudyLog(
        topic=log.topic,
        hours=log.hours,
        study_date=log.study_date,
        focus_level=log.focus_level,
        notes=log.notes,
        user_id=current_user.id,
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    current_user.total_xp = (current_user.total_xp or 0) + 15
    db.commit()

    return new_log


@app.get("/api/logs", response_model=list[schemas.StudyLogResponse])
def get_study_logs(db: DBSession, current_user: CurrentUser, limit: int = 10):
    logs = (
        db.query(models.StudyLog)
        .filter_by(user_id=current_user.id)
        .order_by(models.StudyLog.study_date.desc())
        .limit(limit)
        .all()
    )
    return logs


@app.delete("/api/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_log(log_id: int, db: DBSession, current_user: CurrentUser):
    log = db.query(models.StudyLog).filter_by(id=log_id, user_id=current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()


@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: DBSession, current_user: CurrentUser):
    total_hours = db.query(func.sum(models.StudyLog.hours)).filter_by(user_id=current_user.id).scalar() or 0

    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)

    recent_logs = (
        db.query(models.StudyLog)
        .filter(models.StudyLog.user_id == current_user.id, models.StudyLog.study_date >= seven_days_ago)
        .all()
    )

    all_dates = (
        db.query(models.StudyLog.study_date)
        .filter_by(user_id=current_user.id)
        .order_by(models.StudyLog.study_date.desc())
        .all()
    )

    streak = 0
    current_date = today
    unique_dates = sorted(set(row.study_date for row in all_dates), reverse=True)

    for date in unique_dates:
        if date == current_date or date == current_date - timedelta(days=1):
            streak += 1
            current_date = date
        else:
            break

    chart_data = []
    for i in range(7):
        date = seven_days_ago + timedelta(days=i)
        hours = 0.0
        for log in recent_logs:
            if log.study_date == date:
                hours += log.hours
        chart_data.append({"day": date.strftime("%a"), "hours": round(hours, 1)})

    focus_counts = {"high": 0, "medium": 0, "low": 0}
    for log in recent_logs:
        if log.focus_level in focus_counts:
            focus_counts[log.focus_level] += 1

    total_focus_logs = sum(focus_counts.values())
    if total_focus_logs > 0:
        avg_focus_score = round(
            (focus_counts["high"] * 100 + focus_counts["medium"] * 60 + focus_counts["low"] * 30)
            / total_focus_logs
        )
    else:
        avg_focus_score = 0

    unique_topics = (
        db.query(func.count(func.distinct(models.StudyLog.topic)))
        .filter_by(user_id=current_user.id)
        .scalar()
    )

    return {
        "user": current_user.email,
        "total_hours": float(total_hours),
        "study_streak": streak,
        "average_focus": avg_focus_score,
        "topics_studied": unique_topics or 0,
        "chart_data": chart_data,
    }


@app.post("/api/assessment/generate", response_model=schemas.AssessmentResponse)
def generate_assessment(request: schemas.AssessmentRequest, db: DBSession, current_user: CurrentUser):
    last_log = (
        db.query(models.StudyLog.notes)
        .filter(models.StudyLog.user_id == current_user.id, models.StudyLog.topic == request.topic)
        .order_by(models.StudyLog.id.desc())
        .first()
    )
    notes = last_log[0] if last_log else ""

    try:
        questions = ai_service.generate_assessment_questions(request.topic, notes)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate assessment")

    return {"topic": request.topic, "generated_at": datetime.utcnow(), "questions": questions}


@app.post("/api/tutor/ask", response_model=schemas.ConversationResponse)
async def ask_tutor(request: schemas.ConversationCreate, db: DBSession, current_user: CurrentUser):
    try:
        answer = await ai_service.generate_tutor_response(request.topic, request.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {e}")

    conversation = models.Conversation(
        user_id=current_user.id,
        topic=request.topic,
        question=request.question,
        answer=answer,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    current_user.total_xp = (current_user.total_xp or 0) + 10
    db.commit()

    return conversation


@app.get("/api/tutor/history", response_model=list[schemas.ConversationResponse])
def get_chat_history(db: DBSession, current_user: CurrentUser, limit: int = 20):
    conversations = (
        db.query(models.Conversation)
        .filter_by(user_id=current_user.id)
        .order_by(models.Conversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return conversations


@app.post("/api/study-groups", response_model=schemas.StudyGroupResponse, status_code=status.HTTP_201_CREATED)
def create_study_group(group_data: schemas.StudyGroupCreate, db: DBSession, current_user: CurrentUser):
    existing = db.query(models.StudyGroup).filter_by(name=group_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A study group with this name already exists")

    group = models.StudyGroup(
        name=group_data.name,
        description=group_data.description,
        creator_id=current_user.id,
        is_public=group_data.is_public,
    )
    group.members.append(current_user)
    db.add(group)
    db.commit()
    db.refresh(group)

    current_user.total_xp = (current_user.total_xp or 0) + 50
    db.commit()

    return group


@app.get("/api/study-groups")
def list_study_groups(db: DBSession, current_user: CurrentUser):
    groups = (
        db.query(models.StudyGroup)
        .filter_by(is_public=True)
        .order_by(models.StudyGroup.created_at.desc())
        .all()
    )

    # Compute member counts in a single query to avoid N+1 lazy loads
    group_ids = [g.id for g in groups]
    if group_ids:
        counts_query = (
            db.query(
                models.study_group_members.c.group_id,
                func.count(models.study_group_members.c.user_id).label("cnt"),
            )
            .filter(models.study_group_members.c.group_id.in_(group_ids))
            .group_by(models.study_group_members.c.group_id)
            .all()
        )
        member_counts = {row.group_id: row.cnt for row in counts_query}

        # Which groups the current user belongs to
        user_group_ids = set(
            row.group_id
            for row in db.query(models.study_group_members.c.group_id)
            .filter(models.study_group_members.c.user_id == current_user.id)
            .filter(models.study_group_members.c.group_id.in_(group_ids))
            .all()
        )
    else:
        member_counts = {}
        user_group_ids = set()

    result = []
    for group in groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "is_public": group.is_public,
            "creator_id": group.creator_id,
            "member_count": member_counts.get(group.id, 0),
            "is_member": group.id in user_group_ids,
        })

    return result


@app.get("/api/study-groups/my")
def list_my_study_groups(db: DBSession, current_user: CurrentUser):
    result = []
    for group in current_user.study_groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "is_public": group.is_public,
            "creator_id": group.creator_id,
            "member_count": len(group.members),
            "is_member": True,
        })
    return result


@app.get("/api/study-groups/{group_id}")
def get_study_group(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    is_member = current_user in group.members
    is_creator = group.creator_id == current_user.id

    if not group.is_public and not is_member and not is_creator:
        raise HTTPException(status_code=404, detail="Study group not found")

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "is_public": group.is_public,
        "creator_id": group.creator_id,
        "creator_email": group.creator.email if group.creator else None,
        "member_count": len(group.members),
        "is_member": is_member,
        "is_admin": group.creator_id == current_user.id,
        "created_at": group.created_at,
    }


@app.post("/api/study-groups/{group_id}/join")
def join_study_group(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    if current_user in group.members:
        return {"message": "Already a member", "group_id": group_id}

    group.members.append(current_user)
    current_user.total_xp = (current_user.total_xp or 0) + 20
    db.commit()

    return {"message": "Successfully joined study group", "group_id": group_id}


@app.post("/api/study-groups/{group_id}/leave")
def leave_study_group(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group or current_user not in group.members:
        raise HTTPException(status_code=404, detail="Study group not found or not a member")

    if group.creator_id == current_user.id:
        raise HTTPException(status_code=400, detail="Group creator cannot leave. Transfer ownership or delete the group instead.")

    group.members.remove(current_user)
    db.commit()

    return {"message": "Successfully left study group"}


# ── GROUP CHAT ───────────────────────────────────────────────────────────────

@app.get("/api/study-groups/{group_id}/messages")
def get_group_messages(group_id: int, db: DBSession, current_user: CurrentUser, limit: int = 100):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Join the group to view messages")
    messages = (
        db.query(models.GroupMessage)
        .filter_by(group_id=group_id)
        .order_by(models.GroupMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": m.id,
            "content": m.content,
            "user_id": m.user_id,
            "author_email": m.author.email if m.author else "Unknown",
            "created_at": m.created_at,
        }
        for m in messages
    ]


@app.post("/api/study-groups/{group_id}/messages", status_code=status.HTTP_201_CREATED)
def send_group_message(group_id: int, data: schemas.GroupMessageCreate, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Join the group to send messages")
    msg = models.GroupMessage(group_id=group_id, user_id=current_user.id, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": msg.id,
        "content": msg.content,
        "user_id": msg.user_id,
        "author_email": current_user.email,
        "created_at": msg.created_at,
    }


# ── GROUP FEED ───────────────────────────────────────────────────────────────

@app.get("/api/study-groups/{group_id}/feed")
def get_group_feed(group_id: int, db: DBSession, current_user: CurrentUser, limit: int = 40):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if not group.is_public and current_user not in group.members:
        raise HTTPException(status_code=403, detail="Access denied")
    member_ids = [m.id for m in group.members]
    if not member_ids:
        return []
    members_by_id = {m.id: m.email for m in group.members}
    logs = (
        db.query(models.StudyLog)
        .filter(models.StudyLog.user_id.in_(member_ids))
        .order_by(models.StudyLog.study_date.desc(), models.StudyLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "topic": log.topic,
            "hours": log.hours,
            "study_date": log.study_date,
            "focus_level": log.focus_level,
            "user_email": members_by_id.get(log.user_id, "Unknown"),
        }
        for log in logs
    ]


# ── WEEKLY CHALLENGE ─────────────────────────────────────────────────────────

@app.get("/api/study-groups/{group_id}/weekly")
def get_group_weekly(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    member_ids = [m.id for m in group.members]
    members_by_id = {m.id: m.email for m in group.members}
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())
    if not member_ids:
        return {"week_start": week_start, "entries": []}
    hours_query = (
        db.query(models.StudyLog.user_id, func.sum(models.StudyLog.hours).label("hours"))
        .filter(models.StudyLog.user_id.in_(member_ids), models.StudyLog.study_date >= week_start)
        .group_by(models.StudyLog.user_id)
        .all()
    )
    hours_map = {row.user_id: float(row.hours) for row in hours_query}
    entries = sorted(
        [{"user_email": members_by_id[uid], "hours": round(hours_map.get(uid, 0), 1)} for uid in member_ids],
        key=lambda x: x["hours"],
        reverse=True,
    )
    return {
        "week_start": str(week_start),
        "entries": [{"rank": i + 1, **e} for i, e in enumerate(entries)],
    }


# ── GROUP SESSIONS ────────────────────────────────────────────────────────────

@app.get("/api/study-groups/{group_id}/sessions")
def get_group_sessions(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    sessions = (
        db.query(models.GroupSession)
        .filter_by(group_id=group_id)
        .order_by(models.GroupSession.scheduled_at.asc())
        .all()
    )
    return [
        {
            "id": s.id,
            "title": s.title,
            "topic": s.topic,
            "scheduled_at": s.scheduled_at,
            "duration_minutes": s.duration_minutes,
            "creator_email": s.creator.email if s.creator else "Unknown",
            "creator_id": s.creator_id,
        }
        for s in sessions
    ]


@app.post("/api/study-groups/{group_id}/sessions", status_code=status.HTTP_201_CREATED)
def create_group_session(group_id: int, data: schemas.GroupSessionCreate, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Join the group to schedule sessions")
    s = models.GroupSession(
        group_id=group_id,
        creator_id=current_user.id,
        title=data.title,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        topic=data.topic,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {
        "id": s.id,
        "title": s.title,
        "topic": s.topic,
        "scheduled_at": s.scheduled_at,
        "duration_minutes": s.duration_minutes,
        "creator_email": current_user.email,
        "creator_id": current_user.id,
    }


@app.delete("/api/study-groups/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_session(session_id: int, db: DBSession, current_user: CurrentUser):
    s = db.query(models.GroupSession).filter_by(id=session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    group = db.query(models.StudyGroup).filter_by(id=s.group_id).first()
    if s.creator_id != current_user.id and (group and group.creator_id != current_user.id):
        raise HTTPException(status_code=403, detail="You can only delete your own sessions")
    db.delete(s)
    db.commit()


@app.get("/api/leaderboard/global")
def get_global_leaderboard(db: DBSession, current_user: CurrentUser, limit: int = 50):
    top_users = db.query(models.User).order_by(models.User.total_xp.desc()).limit(limit).all()

    user_ids = [u.id for u in top_users]
    hours_query = (
        db.query(models.StudyLog.user_id, func.sum(models.StudyLog.hours))
        .filter(models.StudyLog.user_id.in_(user_ids))
        .group_by(models.StudyLog.user_id)
        .all()
    )
    hours_by_user = {user_id: hours for user_id, hours in hours_query}

    entries = []
    for idx, user in enumerate(top_users, 1):
        entries.append(schemas.LeaderboardEntry(
            rank=idx,
            user_email=user.email,
            total_xp=user.total_xp or 0,
            study_hours=float(hours_by_user.get(user.id, 0)),
            streak=0,
        ))

    user_rank = None
    for entry in entries:
        if entry.user_email == current_user.email:
            user_rank = entry
            break

    if not user_rank:
        position = (
            db.query(func.count(models.User.id))
            .filter(models.User.total_xp > (current_user.total_xp or 0))
            .scalar()
        ) + 1

        user_hours = db.query(func.sum(models.StudyLog.hours)).filter_by(user_id=current_user.id).scalar() or 0

        user_rank = schemas.LeaderboardEntry(
            rank=position,
            user_email=current_user.email,
            total_xp=current_user.total_xp or 0,
            study_hours=float(user_hours),
            streak=0,
        )

    return schemas.LeaderboardResponse(entries=entries, user_rank=user_rank)


@app.get("/api/leaderboard/group/{group_id}")
def get_group_leaderboard(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    is_member = current_user in group.members
    is_creator = group.creator_id == current_user.id

    if not group.is_public and not is_member and not is_creator:
        raise HTTPException(status_code=403, detail="You do not have access to this group's leaderboard")

    member_ids = [m.id for m in group.members]
    hours_by_member = {}

    if member_ids:
        hours_query = (
            db.query(models.StudyLog.user_id, func.sum(models.StudyLog.hours))
            .filter(models.StudyLog.user_id.in_(member_ids))
            .group_by(models.StudyLog.user_id)
            .all()
        )
        hours_by_member = {user_id: hours for user_id, hours in hours_query}

    sorted_members = sorted(group.members, key=lambda u: u.total_xp or 0, reverse=True)

    entries = []
    for idx, member in enumerate(sorted_members, 1):
        entries.append(schemas.LeaderboardEntry(
            rank=idx,
            user_email=member.email,
            total_xp=member.total_xp or 0,
            study_hours=float(hours_by_member.get(member.id, 0)),
            streak=0,
        ))

    user_rank = None
    for entry in entries:
        if entry.user_email == current_user.email:
            user_rank = entry
            break

    return schemas.LeaderboardResponse(entries=entries, user_rank=user_rank)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "online"}


# ── FLASHCARD ENDPOINTS ──────────────────────────────────────────────────────

def _deck_payload(deck, today):
    due = sum(1 for c in deck.cards if c.next_review is None or c.next_review <= today)
    return {
        "id": deck.id,
        "name": deck.name,
        "description": deck.description,
        "color": deck.color,
        "created_at": deck.created_at,
        "card_count": len(deck.cards),
        "due_count": due,
    }


@app.post("/api/flashcards/decks", status_code=status.HTTP_201_CREATED)
def create_deck(data: schemas.FlashcardDeckCreate, db: DBSession, current_user: CurrentUser):
    deck = models.FlashcardDeck(
        name=data.name,
        description=data.description,
        color=data.color or "#3b82f6",
        user_id=current_user.id,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return _deck_payload(deck, datetime.utcnow().date())


@app.get("/api/flashcards/decks")
def list_decks(db: DBSession, current_user: CurrentUser):
    decks = (
        db.query(models.FlashcardDeck)
        .filter_by(user_id=current_user.id)
        .order_by(models.FlashcardDeck.created_at.desc())
        .all()
    )
    today = datetime.utcnow().date()
    return [_deck_payload(d, today) for d in decks]


@app.delete("/api/flashcards/decks/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(deck_id: int, db: DBSession, current_user: CurrentUser):
    deck = db.query(models.FlashcardDeck).filter_by(id=deck_id, user_id=current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(deck)
    db.commit()


@app.get("/api/flashcards/decks/{deck_id}/cards", response_model=list[schemas.FlashcardResponse])
def get_deck_cards(deck_id: int, db: DBSession, current_user: CurrentUser):
    deck = db.query(models.FlashcardDeck).filter_by(id=deck_id, user_id=current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck.cards


@app.post("/api/flashcards/decks/{deck_id}/cards", response_model=schemas.FlashcardResponse, status_code=status.HTTP_201_CREATED)
def add_card(deck_id: int, data: schemas.FlashcardCreate, db: DBSession, current_user: CurrentUser):
    deck = db.query(models.FlashcardDeck).filter_by(id=deck_id, user_id=current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    card = models.Flashcard(
        front=data.front,
        back=data.back,
        deck_id=deck_id,
        next_review=datetime.utcnow().date(),
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@app.post("/api/flashcards/decks/{deck_id}/generate")
def generate_deck_cards(deck_id: int, data: schemas.FlashcardGenerateRequest, db: DBSession, current_user: CurrentUser):
    deck = db.query(models.FlashcardDeck).filter_by(id=deck_id, user_id=current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    generated = ai_service.generate_flashcards(data.topic, data.count)
    if not generated:
        raise HTTPException(status_code=500, detail="AI failed to generate flashcards. Try a more specific topic.")

    today = datetime.utcnow().date()
    new_cards = []
    for item in generated:
        card = models.Flashcard(front=item["front"], back=item["back"], deck_id=deck_id, next_review=today)
        db.add(card)
        new_cards.append(card)

    db.commit()
    for c in new_cards:
        db.refresh(c)

    return {"generated": len(new_cards), "cards": new_cards}


@app.delete("/api/flashcards/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: int, db: DBSession, current_user: CurrentUser):
    card = (
        db.query(models.Flashcard)
        .join(models.FlashcardDeck)
        .filter(models.Flashcard.id == card_id, models.FlashcardDeck.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()


@app.post("/api/flashcards/cards/{card_id}/review")
def review_card(card_id: int, data: schemas.FlashcardReview, db: DBSession, current_user: CurrentUser):
    card = (
        db.query(models.Flashcard)
        .join(models.FlashcardDeck)
        .filter(models.Flashcard.id == card_id, models.FlashcardDeck.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    rating = data.rating
    if rating < 3:
        card.repetitions = 0
        card.interval = 1
    else:
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.ease_factor)
        card.repetitions += 1

    card.ease_factor = max(1.3, card.ease_factor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    card.next_review = datetime.utcnow().date() + timedelta(days=card.interval)
    db.commit()
    db.refresh(card)

    return {
        "id": card.id,
        "next_review": card.next_review,
        "interval": card.interval,
        "ease_factor": round(card.ease_factor, 2),
        "repetitions": card.repetitions,
    }

# ── STUDY GOALS ──────────────────────────────────────────────────────────────

@app.get("/api/goals/progress")
def get_goals_progress(db: DBSession, current_user: CurrentUser):
    from datetime import date, timedelta
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    goals = db.query(models.StudyGoal).filter_by(user_id=current_user.id).all()
    if not goals:
        return {"goals": [], "week_start": str(week_start)}

    subjects = [g.subject for g in goals]
    hours_this_week = (
        db.query(models.StudyLog.topic, func.sum(models.StudyLog.hours))
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.study_date >= week_start,
        )
        .group_by(models.StudyLog.topic)
        .all()
    )
    hours_by_topic = {topic.lower(): float(h) for topic, h in hours_this_week}

    result = []
    for g in goals:
        current = sum(v for k, v in hours_by_topic.items() if g.subject.lower() in k or k in g.subject.lower())
        result.append({
            "id": g.id,
            "subject": g.subject,
            "weekly_hours_target": g.weekly_hours_target,
            "current_hours": round(current, 2),
        })

    return {"goals": result, "week_start": str(week_start)}


@app.get("/api/goals")
def get_goals(db: DBSession, current_user: CurrentUser):
    goals = db.query(models.StudyGoal).filter_by(user_id=current_user.id).order_by(models.StudyGoal.created_at).all()
    return [{"id": g.id, "subject": g.subject, "weekly_hours_target": g.weekly_hours_target} for g in goals]


@app.post("/api/goals", status_code=status.HTTP_201_CREATED)
def create_goal(data: schemas.StudyGoalCreate, db: DBSession, current_user: CurrentUser):
    existing = db.query(models.StudyGoal).filter_by(user_id=current_user.id, subject=data.subject).first()
    if existing:
        raise HTTPException(status_code=400, detail="A goal for this subject already exists")
    goal = models.StudyGoal(
        user_id=current_user.id,
        subject=data.subject,
        weekly_hours_target=data.weekly_hours_target,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "subject": goal.subject, "weekly_hours_target": goal.weekly_hours_target}


@app.delete("/api/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, db: DBSession, current_user: CurrentUser):
    goal = db.query(models.StudyGoal).filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()


# ── STUDY NOTES ──────────────────────────────────────────────────────────────

@app.get("/api/notes")
def get_notes(db: DBSession, current_user: CurrentUser, q: str = ""):
    query = db.query(models.StudyNote).filter_by(user_id=current_user.id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            models.StudyNote.title.ilike(like) |
            models.StudyNote.content.ilike(like) |
            models.StudyNote.tags.ilike(like)
        )
    notes = query.order_by(models.StudyNote.updated_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "tags": n.tags,
            "log_id": n.log_id,
            "created_at": n.created_at,
            "updated_at": n.updated_at,
        }
        for n in notes
    ]


@app.post("/api/notes", status_code=status.HTTP_201_CREATED)
def create_note(data: schemas.StudyNoteCreate, db: DBSession, current_user: CurrentUser):
    note = models.StudyNote(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        tags=data.tags,
        log_id=data.log_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id": note.id, "title": note.title, "content": note.content,
        "tags": note.tags, "log_id": note.log_id,
        "created_at": note.created_at, "updated_at": note.updated_at,
    }


@app.put("/api/notes/{note_id}")
def update_note(note_id: int, data: schemas.StudyNoteUpdate, db: DBSession, current_user: CurrentUser):
    note = db.query(models.StudyNote).filter_by(id=note_id, user_id=current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    if data.tags is not None:
        note.tags = data.tags
    if data.log_id is not None:
        note.log_id = data.log_id
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return {
        "id": note.id, "title": note.title, "content": note.content,
        "tags": note.tags, "log_id": note.log_id,
        "created_at": note.created_at, "updated_at": note.updated_at,
    }


@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: DBSession, current_user: CurrentUser):
    note = db.query(models.StudyNote).filter_by(id=note_id, user_id=current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()


# ── BADGES ───────────────────────────────────────────────────────────────────

@app.get("/api/badges")
def get_badges(db: DBSession, current_user: CurrentUser):
    from datetime import date as dt_date, timedelta

    total_logs    = db.query(func.count(models.StudyLog.id)).filter_by(user_id=current_user.id).scalar() or 0
    total_hours   = float(db.query(func.sum(models.StudyLog.hours)).filter_by(user_id=current_user.id).scalar() or 0)
    total_xp      = current_user.total_xp or 0
    distinct_subj = db.query(func.count(func.distinct(models.StudyLog.topic))).filter_by(user_id=current_user.id).scalar() or 0
    group_count   = len(current_user.study_groups)
    flashcard_cnt = (
        db.query(func.count(models.Flashcard.id))
        .join(models.FlashcardDeck)
        .filter(models.FlashcardDeck.user_id == current_user.id)
        .scalar() or 0
    )
    notes_count = db.query(func.count(models.StudyNote.id)).filter_by(user_id=current_user.id).scalar() or 0

    log_dates = set(
        r[0] for r in
        db.query(func.distinct(models.StudyLog.study_date)).filter_by(user_id=current_user.id).all()
    )
    streak = 0
    d = dt_date.today()
    while d in log_dates:
        streak += 1
        d -= timedelta(days=1)

    BADGES = [
        {"id": "first_step",   "name": "First Step",    "emoji": "🌱", "desc": "Log your first study session",       "earned": total_logs >= 1},
        {"id": "hot_streak",   "name": "Hot Streak",    "emoji": "🔥", "desc": "Maintain a 7-day study streak",      "earned": streak >= 7},
        {"id": "iron_will",    "name": "Iron Will",     "emoji": "💪", "desc": "Maintain a 30-day study streak",     "earned": streak >= 30},
        {"id": "bookworm",     "name": "Bookworm",      "emoji": "📚", "desc": "Accumulate 10 total study hours",    "earned": total_hours >= 10},
        {"id": "scholar",      "name": "Scholar",       "emoji": "🎓", "desc": "Accumulate 50 total study hours",    "earned": total_hours >= 50},
        {"id": "century",      "name": "Century",       "emoji": "💯", "desc": "Accumulate 100 total study hours",   "earned": total_hours >= 100},
        {"id": "team_player",  "name": "Team Player",   "emoji": "👥", "desc": "Join a study group",                "earned": group_count >= 1},
        {"id": "flashmaster",  "name": "Flashmaster",   "emoji": "⚡", "desc": "Create 20+ flashcards",             "earned": flashcard_cnt >= 20},
        {"id": "xp_hunter",    "name": "XP Hunter",     "emoji": "🏆", "desc": "Earn 300+ XP",                      "earned": total_xp >= 300},
        {"id": "polymath",     "name": "Polymath",      "emoji": "🧠", "desc": "Study 5+ different subjects",        "earned": distinct_subj >= 5},
        {"id": "note_taker",   "name": "Note Taker",    "emoji": "📝", "desc": "Write 5 or more notes",             "earned": notes_count >= 5},
        {"id": "dedicated",    "name": "Dedicated",     "emoji": "🎯", "desc": "Log 50 or more study sessions",     "earned": total_logs >= 50},
    ]
    earned = sum(1 for b in BADGES if b["earned"])
    return {"badges": BADGES, "earned_count": earned, "total": len(BADGES)}


# ── STUDY CALENDAR ───────────────────────────────────────────────────────────

@app.get("/api/calendar")
def get_calendar(db: DBSession, current_user: CurrentUser, year: int = None, month: int = None):
    from datetime import date as dt_date
    import calendar as cal_mod

    today = dt_date.today()
    y = year or today.year
    m = month or today.month

    _, days_in_month = cal_mod.monthrange(y, m)
    start = dt_date(y, m, 1)
    end   = dt_date(y, m, days_in_month)

    rows = (
        db.query(models.StudyLog.study_date, func.sum(models.StudyLog.hours))
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.study_date >= start,
            models.StudyLog.study_date <= end,
        )
        .group_by(models.StudyLog.study_date)
        .all()
    )
    hours_by_day = {str(r[0]): float(r[1]) for r in rows}

    days = []
    for day in range(1, days_in_month + 1):
        d_str = str(dt_date(y, m, day))
        days.append({"date": d_str, "hours": hours_by_day.get(d_str, 0.0)})

    total_days_active = len(hours_by_day)
    total_hours = sum(hours_by_day.values())

    # all-time heatmap (last 52 weeks) for contrib graph
    heatmap_end   = today
    heatmap_start = today.replace(year=today.year - 1)
    heatmap_rows  = (
        db.query(models.StudyLog.study_date, func.sum(models.StudyLog.hours))
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.study_date >= heatmap_start,
        )
        .group_by(models.StudyLog.study_date)
        .all()
    )
    heatmap = {str(r[0]): float(r[1]) for r in heatmap_rows}

    return {
        "year": y,
        "month": m,
        "days": days,
        "days_active": total_days_active,
        "total_hours": round(total_hours, 2),
        "heatmap": heatmap,
    }
