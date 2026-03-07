from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    ForeignKey, Text, Table, Boolean, func,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime as dt


study_group_members = Table(
    "study_group_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    total_xp = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)

    study_groups = relationship(
        "StudyGroup",
        secondary=study_group_members,
        back_populates="members",
        overlaps="member_groups",
    )
    logs = relationship(
        "StudyLog",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    owned_groups = relationship(
        "StudyGroup",
        back_populates="creator",
        cascade="all",
        foreign_keys="StudyGroup.creator_id",
    )


class StudyLog(Base):
    __tablename__ = "study_logs"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True, nullable=False)
    hours = Column(Float, nullable=False)
    study_date = Column(Date, nullable=False)
    focus_level = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)

    owner = relationship("User", back_populates="logs")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String, index=True, nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)

    user = relationship("User", back_populates="conversations")


class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)

    creator = relationship(
        "User",
        back_populates="owned_groups",
        foreign_keys=[creator_id],
    )
    members = relationship(
        "User",
        secondary=study_group_members,
        back_populates="study_groups",
        overlaps="study_groups",
    )


class KanbanBoard(Base):
    __tablename__ = "kanban_boards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)

    columns = relationship(
        "KanbanColumn",
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="KanbanColumn.position",
    )


class KanbanColumn(Base):
    __tablename__ = "kanban_columns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    position = Column(Integer, default=0, nullable=False)
    board_id = Column(Integer, ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False)

    board = relationship("KanbanBoard", back_populates="columns")
    cards = relationship(
        "KanbanCard",
        back_populates="column",
        cascade="all, delete-orphan",
        order_by="KanbanCard.position",
    )


class KanbanCard(Base):
    __tablename__ = "kanban_cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(Integer, default=3, nullable=False)
    position = Column(Integer, default=0, nullable=False)
    ai_suggestion = Column(Text, nullable=True)
    column_id = Column(Integer, ForeignKey("kanban_columns.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=dt.utcnow, nullable=True)
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow, nullable=True)

    column = relationship("KanbanColumn", back_populates="cards")