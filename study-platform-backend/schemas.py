from datetime import date, datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class FocusLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class StudyLogBase(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)
    hours: float = Field(..., gt=0, le=24)
    study_date: date
    focus_level: FocusLevel
    notes: Optional[str] = Field(None, max_length=1000)


class StudyLogCreate(StudyLogBase):
    pass


class StudyLogResponse(StudyLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class AssessmentRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)


class AssessmentResponse(BaseModel):
    topic: str
    generated_at: datetime
    questions: str
