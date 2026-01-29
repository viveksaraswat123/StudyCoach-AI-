from pydantic import BaseModel
from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr

class StudyLogBase(BaseModel):
    topic: str
    hours: float
    study_date: date
    focus_level: str
    notes: Optional[str] = None

class StudyLogCreate(StudyLogBase):
    pass

class StudyLogResponse(StudyLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True



class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str