from datetime import date, datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, field_validator

class FocusLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class ORMBase(BaseModel):
    class Config:
        from_attributes = True

#Study Logs
class StudyLogBase(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)
    hours: float = Field(..., gt=0, le=24)
    study_date: date
    focus_level: FocusLevel
    notes: Optional[str] = Field(None, max_length=1000)


class StudyLogCreate(StudyLogBase):
    pass

class StudyLogResponse(ORMBase, StudyLogBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

#users
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class UserResponse(ORMBase, UserBase):
    id: int
    total_xp: Optional[int] = 0
    created_at: Optional[datetime] = None

#auth
class Token(BaseModel):
    access_token: str
    token_type: str

#assessment
class AssessmentRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)


class QuestionOption(BaseModel):
    text: str
    is_correct: bool


class AssessmentQuestion(BaseModel):
    question_text: str
    options: List[QuestionOption]


class AssessmentResponse(BaseModel):
    topic: str
    generated_at: datetime
    questions: List[AssessmentQuestion]


#tutor Chat 
class ConversationCreate(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)
    question: str = Field(..., min_length=10, max_length=2000)


class ConversationResponse(ORMBase):
    id: int
    topic: str
    question: str
    answer: str
    created_at: datetime


#Study Groups 
class StudyGroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = True


class StudyGroupResponse(ORMBase):
    id: int
    name: str
    description: Optional[str] = None
    creator_id: int
    is_public: bool
    created_at: datetime
    member_count: int = 0

    @field_validator("member_count", mode="before")
    @classmethod
    def compute_member_count(cls, v, info):
        # If the ORM object exposes a members list, use its length
        data = info.data if hasattr(info, "data") else {}
        members = data.get("members")
        if members is not None:
            return len(members)
        return v or 0


class StudyGroupDetailResponse(StudyGroupResponse):
    members: List[UserResponse] = []

#leaderboard
class LeaderboardEntry(BaseModel):
    rank: int
    user_email: str
    total_xp: int = 0
    study_hours: float = 0.0
    streak: int = 0


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    user_rank: Optional[LeaderboardEntry] = None


#kanban
class KanbanBoardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    

class KanbanBoardResponse(ORMBase):
    id: int
    name: str
    owner_id: Optional[int] = None
    created_at: datetime


class KanbanColumnCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    board_id: int


class KanbanColumnResponse(ORMBase):
    id: int
    title: str
    position: int
    board_id: int


class KanbanCardCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None
    priority: Optional[int] = Field(3, ge=1, le=5)
    column_id: int


class KanbanCardUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    column_id: Optional[int] = None
    position: Optional[int] = None


class KanbanCardResponse(ORMBase):
    id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: int
    position: int
    ai_suggestion: Optional[str] = None
    column_id: int


class KanbanSuggestionResponse(BaseModel):
    suggested_title: str
    suggested_priority: int = Field(..., ge=1, le=5)
    suggested_notes: Optional[str] = None