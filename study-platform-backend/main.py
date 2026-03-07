from datetime import datetime, timedelta
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt
import models
import schemas
import database
import ai_service
import auth

app = FastAPI(
    title="AI Study Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)

@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=database.engine)
    init_db()

# Database migration helper - add missing columns to existing tables
def init_db():
    """Initialize database with new columns if they don't exist"""
    from sqlalchemy import text, inspect
    inspector = inspect(database.engine)

    if 'users' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('users')]

        try:
            if 'total_xp' not in columns:
                with database.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN total_xp INTEGER DEFAULT 0"))
                    conn.commit()
                    print("✓ Added total_xp column to users table")
        except Exception as e:
            print(f"Note: total_xp column may already exist: {e}")

        try:
            if 'created_at' not in columns:
                with database.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP"))
                    conn.commit()
                    print("✓ Added created_at column to users table")
        except Exception as e:
            print(f"Note: created_at column may already exist: {e}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
DBSession = Annotated[Session, Depends(database.get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


# Auth Dependency
def get_current_user(
    token: TokenDep,
    db: DBSession,
) -> models.User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            auth.SECRET_KEY,
            algorithms=[auth.ALGORITHM],
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter_by(email=email).first()
    if not user:
        raise credentials_exception

    return user


CurrentUser = Annotated[models.User, Depends(get_current_user)]

# Register kanban router (import here to avoid circular imports)
import kanban
app.include_router(kanban.router, prefix="/api/kanban")


#Auth Routes
@app.post(
    "/api/register",
    response_model=schemas.Token,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: schemas.UserCreate,
    db: DBSession,
) -> schemas.Token:

    if db.query(models.User).filter_by(email=user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

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


@app.post(
    "/api/login",
    response_model=schemas.Token,
)
def login(
    db: DBSession,
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> schemas.Token:

    user = db.query(models.User).filter_by(
        email=form_data.username
    ).first()

    if not user or not auth.verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = auth.create_access_token({"sub": user.email})

    return {"access_token": token, "token_type": "bearer"}


#User api 
@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_profile(current_user: CurrentUser):
    """Return the current user's profile data"""
    return current_user


@app.patch("/api/users/me", response_model=schemas.UserResponse)
def update_profile(
    updates: schemas.UserUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    """Update email and/or password"""
    if updates.email and updates.email != current_user.email:
        existing = db.query(models.User).filter_by(email=updates.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = updates.email

    if updates.password:
        '''Hash the new password before storing — storing a plaintext
        password here would be a critical security vulnerability'''
        current_user.hashed_password = auth.hash_password(updates.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@app.delete("/api/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: DBSession,
    current_user: CurrentUser,
):
    """Permanently delete the current user's account and all associated data"""
    db.delete(current_user)
    db.commit()


@app.get("/api/users/me/stats")
def get_profile_stats(
    db: DBSession,
    current_user: CurrentUser,
):
    """Return aggregated stats for the Profile page"""
    total_hours = (
        db.query(func.coalesce(func.sum(models.StudyLog.hours), 0))
        .filter(models.StudyLog.user_id == current_user.id)
        .scalar()
    )
    total_sessions = (
        db.query(func.count(models.StudyLog.id))
        .filter(models.StudyLog.user_id == current_user.id)
        .scalar()
    )

    # Streak
    today = datetime.utcnow().date()
    all_logs = (
        db.query(models.StudyLog.study_date)
        .filter(models.StudyLog.user_id == current_user.id)
        .order_by(models.StudyLog.study_date.desc())
        .all()
    )
    streak = 0
    if all_logs:
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


#Study Logs 
@app.post(
    "/api/logs",
    response_model=schemas.StudyLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_log(
    log: schemas.StudyLogCreate,
    db: DBSession,
    current_user: CurrentUser,
):
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


@app.get("/api/logs")
def get_study_logs(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = 10,
):
    logs = (
        db.query(models.StudyLog)
        .filter(models.StudyLog.user_id == current_user.id)
        .order_by(models.StudyLog.study_date.desc())
        .limit(limit)
        .all()
    )
    return logs


#dashboard api
@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: DBSession,
    current_user: CurrentUser,
):
    # Total hours
    total_hours: float = (
        db.query(func.coalesce(func.sum(models.StudyLog.hours), 0))
        .filter(models.StudyLog.user_id == current_user.id)
        .scalar()
    )

    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)

    recent_logs = (
        db.query(models.StudyLog)
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.study_date >= seven_days_ago,
        )
        .all()
    )

    # Calculate study streak
    all_logs = (
        db.query(models.StudyLog.study_date)
        .filter(models.StudyLog.user_id == current_user.id)
        .order_by(models.StudyLog.study_date.desc())
        .all()
    )

    '''Deduplicate dates before streak calculation — if a user logged
     multiple sessions on the same day, the original loop incremented streak
    once per session row rather than once per day, producing inflated streaks'''
    streak = 0
    if all_logs:
        unique_dates = sorted(set(log.study_date for log in all_logs), reverse=True)
        current_date = today
        for date in unique_dates:
            if date == current_date or date == current_date - timedelta(days=1):
                streak += 1
                current_date = date
            else:
                break

    # Prepare chart data
    chart_data = {}
    for i in range(7):
        date = seven_days_ago + timedelta(days=i)
        '''Use full weekday abbreviations ("Mon", "Tue" …) instead of
        single characters — "%a"[0] maps Mon→M, Tue→T, Wed→W, Thu→T (clash),
        making two days indistinguishable on the chart'''
        day_name = date.strftime("%a")
        chart_data[date] = {"day": day_name, "hours": 0.0}

    for log in recent_logs:
        if log.study_date in chart_data:
            chart_data[log.study_date]["hours"] += log.hours

    # Round chart hours to 1 decimal place to avoid floating-point
    # noise (e.g. 1.0000000000000002) being sent to the frontend
    chart_array = [
        {**entry, "hours": round(entry["hours"], 1)}
        for entry in chart_data.values()
    ]

    # Average focus level
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

    # Unique topics
    unique_topics = (
        db.query(func.count(func.distinct(models.StudyLog.topic)))
        .filter(models.StudyLog.user_id == current_user.id)
        .scalar()
    )

    return {
        "user": current_user.email,
        "total_hours": float(total_hours),
        "study_streak": streak,
        "average_focus": avg_focus_score,
        "topics_studied": unique_topics or 0,
        "chart_data": chart_array,
    }


#ai assessment api
@app.post(
    "/api/assessment/generate",
    response_model=schemas.AssessmentResponse,
)
def generate_assessment(
    request: schemas.AssessmentRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    last_log = (
        db.query(models.StudyLog.notes)
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.topic == request.topic,
        )
        .order_by(models.StudyLog.id.desc())
        .first()
    )

    notes = last_log[0] if last_log else ""

    try:
        questions = ai_service.generate_assessment_questions(
            request.topic,
            notes,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate assessment",
        )

    return {
        "topic": request.topic,
        "generated_at": datetime.utcnow(),
        "questions": questions,
    }


#AI tutor api
@app.post(
    "/api/tutor/ask",
    response_model=schemas.ConversationResponse,
)
def ask_tutor(
    request: schemas.ConversationCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    """AI Tutor responds to student questions"""
    try:
        answer = ai_service.generate_tutor_response(
            request.topic,
            request.question,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}",
        )

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


@app.get("/api/tutor/history")
def get_chat_history(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = 20,
):
    """Get user's chat history"""
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == current_user.id)
        .order_by(models.Conversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return conversations


#Study Groups api
@app.post(
    "/api/study-groups",
    response_model=schemas.StudyGroupResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_study_group(
    group_data: schemas.StudyGroupCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    """Create a new study group"""
    # FIX 11: Check for duplicate group names to prevent confusing duplicates
    if db.query(models.StudyGroup).filter_by(name=group_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A study group with this name already exists",
        )

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
def list_study_groups(
    db: DBSession,
    current_user: CurrentUser,
):
    """List all public study groups"""
    groups = (
        db.query(models.StudyGroup)
        .filter(models.StudyGroup.is_public == True)
        .order_by(models.StudyGroup.created_at.desc())
        .all()
    )
    return groups

@app.get("/api/study-groups/my")
def list_my_study_groups(
    db: DBSession,
    current_user: CurrentUser,
):
    """List all study groups the current user is a member of"""
    return current_user.study_groups


@app.get("/api/study-groups/{group_id}")
def get_study_group(
    group_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Get study group details"""
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group or (
        not group.is_public
        and current_user not in group.members
        and group.creator_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found",
        )

    return group


@app.post("/api/study-groups/{group_id}/join")
def join_study_group(
    group_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Join a study group"""
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found",
        )

    if current_user in group.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already member of this group",
        )

    group.members.append(current_user)
    current_user.total_xp = (current_user.total_xp or 0) + 20
    db.commit()

    return {"message": "Successfully joined study group", "group_id": group_id}


@app.post("/api/study-groups/{group_id}/leave")
def leave_study_group(
    group_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Leave a study group"""
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group or current_user not in group.members:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found or not a member",
        )

    # FIX 14: Prevent the creator from leaving their own group — if the
    # creator leaves, the group becomes ownerless with no way to manage it
    if group.creator_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group creator cannot leave. Transfer ownership or delete the group instead.",
        )

    group.members.remove(current_user)
    db.commit()

    return {"message": "Successfully left study group"}


#leaderboards api

@app.get("/api/leaderboard/global")
def get_global_leaderboard(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = 50,
):
    """Get global XP leaderboard"""
    top_users = (
        db.query(models.User)
        .order_by(models.User.total_xp.desc())
        .limit(limit)
        .all()
    )
    user_ids = [u.id for u in top_users]
    hours_by_user = dict(
        db.query(
            models.StudyLog.user_id,
            func.coalesce(func.sum(models.StudyLog.hours), 0),
        )
        .filter(models.StudyLog.user_id.in_(user_ids))
        .group_by(models.StudyLog.user_id)
        .all()
    )

    entries = []
    for idx, user in enumerate(top_users, 1):
        entries.append(
            schemas.LeaderboardEntry(
                rank=idx,
                user_email=user.email,
                total_xp=user.total_xp or 0,
                study_hours=float(hours_by_user.get(user.id, 0)),
                streak=0,
            )
        )

    user_rank = next(
        (e for e in entries if e.user_email == current_user.email), None
    )
    if not user_rank:
        user_position = (
            db.query(func.count(models.User.id))
            .filter(models.User.total_xp > (current_user.total_xp or 0))
            .scalar()
        ) + 1  

        user_hours = float(
            db.query(func.coalesce(func.sum(models.StudyLog.hours), 0))
            .filter(models.StudyLog.user_id == current_user.id)
            .scalar()
        )
        user_rank = schemas.LeaderboardEntry(
            rank=user_position,
            user_email=current_user.email,
            total_xp=current_user.total_xp or 0,
            study_hours=user_hours,
            streak=0,
        )

    return schemas.LeaderboardResponse(entries=entries, user_rank=user_rank)

@app.get("/api/leaderboard/group/{group_id}")
def get_group_leaderboard(
    group_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Get leaderboard for a specific study group"""
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found",
        )
    
    if not group.is_public and current_user not in group.members and group.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this group's leaderboard",
        )

    member_ids = [m.id for m in group.members]
    hours_by_member = dict(
        db.query(
            models.StudyLog.user_id,
            func.coalesce(func.sum(models.StudyLog.hours), 0),
        )
        .filter(models.StudyLog.user_id.in_(member_ids))
        .group_by(models.StudyLog.user_id)
        .all()
    ) if member_ids else {}

    entries = []
    for idx, member in enumerate(
        sorted(group.members, key=lambda u: u.total_xp or 0, reverse=True), 1
    ):
        entries.append(
            schemas.LeaderboardEntry(
                rank=idx,
                user_email=member.email,
                total_xp=member.total_xp or 0,
                study_hours=float(hours_by_member.get(member.id, 0)),
                streak=0,
            )
        )

    user_rank = next(
        (e for e in entries if e.user_email == current_user.email), None
    )

    return schemas.LeaderboardResponse(entries=entries, user_rank=user_rank)

#health check endpoint
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "online"}