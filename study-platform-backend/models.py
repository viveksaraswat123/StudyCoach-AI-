from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Table, Boolean, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime as dt

# Association table for Study Group members
study_group_members = Table(
    'study_group_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('group_id', Integer, ForeignKey('study_groups.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    total_xp = Column(Integer, default=0)  # For leaderboard
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)

    logs = relationship("StudyLog", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    owned_groups = relationship("StudyGroup", back_populates="creator", cascade="all, delete-orphan")
    member_groups = relationship("StudyGroup", secondary=study_group_members, back_populates="members")

class StudyLog(Base):
    __tablename__ = "study_logs"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    hours = Column(Float)
    study_date = Column(Date)
    focus_level = Column(String)
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="logs")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, index=True)
    question = Column(Text)
    answer = Column(Text)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)
    
    user = relationship("User", back_populates="conversations")

class StudyGroup(Base):
    __tablename__ = "study_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)
    is_public = Column(Boolean, default=True)
    
    creator = relationship("User", back_populates="owned_groups")
    members = relationship("User", secondary=study_group_members, back_populates="member_groups")


# Kanban Models
class KanbanBoard(Base):
    __tablename__ = "kanban_boards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())

    columns = relationship("KanbanColumn", back_populates="board", cascade="all, delete-orphan")


class KanbanColumn(Base):
    __tablename__ = "kanban_columns"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    position = Column(Integer, default=0)
    board_id = Column(Integer, ForeignKey("kanban_boards.id"))

    board = relationship("KanbanBoard", back_populates="columns")
    cards = relationship("KanbanCard", back_populates="column", cascade="all, delete-orphan")


class KanbanCard(Base):
    __tablename__ = "kanban_cards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(Integer, default=3)
    position = Column(Integer, default=0)
    ai_suggestion = Column(Text, nullable=True)
    column_id = Column(Integer, ForeignKey("kanban_columns.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    column = relationship("KanbanColumn", back_populates="cards")