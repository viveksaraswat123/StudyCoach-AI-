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
import kanban


app = FastAPI(title="AI Study Platform", version="1.0.0", docs_url="/docs", redoc_url=None)


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
def register(user_data: schemas.UserCreate, db: DBSession):
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
def login(db: DBSession, form_data: OAuth2PasswordRequestForm = Depends()):
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

    result = []
    for group in groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "is_public": group.is_public,
            "creator_id": group.creator_id,
            "member_count": len(group.members),
            "is_member": current_user in group.members,
        })

    return result


@app.get("/api/study-groups/my")
def list_my_study_groups(current_user: CurrentUser):
    return current_user.study_groups


@app.get("/api/study-groups/{group_id}")
def get_study_group(group_id: int, db: DBSession, current_user: CurrentUser):
    group = db.query(models.StudyGroup).filter_by(id=group_id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    is_member = current_user in group.members
    is_creator = group.creator_id == current_user.id

    if not group.is_public and not is_member and not is_creator:
        raise HTTPException(status_code=404, detail="Study group not found")

    return group


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