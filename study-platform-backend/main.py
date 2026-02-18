from datetime import datetime
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


models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Study Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise credentials_exception

    return user


@app.post("/api/register", response_model=schemas.Token)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(database.get_db),
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user_data.email,
        hashed_password=auth.hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token({"sub": new_user.email})

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == form_data.username)
        .first()
    )

    if not user or not auth.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = auth.create_access_token({"sub": user.email})

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/logs", response_model=schemas.StudyLogResponse)
def create_study_log(
    log: schemas.StudyLogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
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

    return new_log


@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    total_hours = (
        db.query(func.sum(models.StudyLog.hours))
        .filter(models.StudyLog.user_id == current_user.id)
        .scalar()
    )

    return {
        "user": current_user.email,
        "total_hours": total_hours or 0,
    }


@app.post("/api/assessment/generate", response_model=schemas.AssessmentResponse)
def generate_assessment(
    request: schemas.AssessmentRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    last_log = (
        db.query(models.StudyLog)
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.topic == request.topic,
        )
        .order_by(models.StudyLog.id.desc())
        .first()
    )

    notes = last_log.notes if last_log else ""

    try:
        questions = ai_service.generate_assessment_questions(
            request.topic, notes
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate assessment",
        )

    return {
        "topic": request.topic,
        "generated_at": datetime.utcnow(),
        "questions": questions,
    }


@app.get("/health")
def health_check():
    return {"status": "online"}
