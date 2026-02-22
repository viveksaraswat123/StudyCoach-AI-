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