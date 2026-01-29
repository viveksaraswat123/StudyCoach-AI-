from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt

# Local imports
import models
import schemas
import database
import ai_service
import auth

# --- DATABASE INIT ---
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Lumina AI Study Platform")

# --- CORS CONFIGURATION ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY CONFIGURATION ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    return user

# --- AUTH ROUTES ---

@app.post("/api/register", response_model=schemas.Token)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    existing_user = db.query(models.User)\
        .filter(models.User.email == user_data.email)\
        .first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user_data.email,
        hashed_password=auth.hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer"}

# OAuth2-compatible login (Swagger + standard)
@app.post("/api/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User)\
        .filter(models.User.email == form_data.username)\
        .first()

    if not user or not auth.verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# --- STUDY LOG ROUTES ---

@app.post("/api/logs", response_model=schemas.StudyLogResponse)
def create_study_log(
    log: schemas.StudyLogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_log = models.StudyLog(
        topic=log.topic,
        hours=log.hours,
        study_date=log.study_date,
        focus_level=log.focus_level,
        notes=log.notes,
        user_id=current_user.id
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    total_hours = db.query(func.sum(models.StudyLog.hours))\
        .filter(models.StudyLog.user_id == current_user.id)\
        .scalar()

    return {
        "total_hours": total_hours or 0,
        "accuracy": "88%",
        "streak": 12,
        "user": current_user.email
    }

# --- AI ASSESSMENT ROUTES ---

@app.get("/api/assessment/generate/{topic}")
def get_quiz(
    topic: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    last_log = db.query(models.StudyLog)\
        .filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.topic == topic
        )\
        .order_by(models.StudyLog.id.desc())\
        .first()

    notes = last_log.notes if last_log else ""
    question = ai_service.generate_assessment_question(topic, notes)

    return {"question": question}

# --- HEALTH CHECK ---

@app.get("/health")
def health_check():
    return {"status": "online"}
