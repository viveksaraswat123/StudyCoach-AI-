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


# Chat / Tutor Schemas
class ConversationCreate(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)
    question: str = Field(..., min_length=10, max_length=2000)


class ConversationResponse(BaseModel):
    id: int
    topic: str
    question: str
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True


# Study Group Schemas
class StudyGroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = True


class StudyGroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    creator_id: int
    is_public: bool
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True


class StudyGroupDetailResponse(StudyGroupResponse):
    members: List[UserResponse] = []


# Leaderboard Schemas
class LeaderboardEntry(BaseModel):
    rank: int
    user_email: str
    total_xp: int
    study_hours: float
    streak: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    user_rank: Optional[LeaderboardEntry] = None


# Kanban Schemas
class KanbanBoardCreate(BaseModel):
    name: str


class KanbanBoardResponse(BaseModel):
    id: int
    name: str
    owner_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class KanbanColumnCreate(BaseModel):
    title: str
    board_id: int


class KanbanColumnResponse(BaseModel):
    id: int
    title: str
    position: int
    board_id: int

    class Config:
        from_attributes = True


class KanbanCardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[int] = 3
    column_id: int


class KanbanCardUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    due_date: Optional[datetime]
    priority: Optional[int]
    column_id: Optional[int]
    position: Optional[int]


class KanbanCardResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    priority: int
    position: int
    ai_suggestion: Optional[str]
    column_id: int

    class Config:
        from_attributes = True


class KanbanSuggestionResponse(BaseModel):
    suggested_title: str
    suggested_priority: int
    suggested_notes: Optional[str]
