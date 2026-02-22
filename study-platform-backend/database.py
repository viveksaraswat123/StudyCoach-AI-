import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load .env only in development
load_dotenv()

# Get DATABASE_URL from environment (Render sets this automatically)
DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# Fix Render PostgreSQL URL format (convert postgres:// to postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Debug: Print if running on Render (first 50 chars only for security)
if DATABASE_URL:
    print(f"✓ DATABASE_URL configured: {DATABASE_URL[:50]}...")
else:
    print("✗ WARNING: DATABASE_URL not found!")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in environment variables. Check Render dashboard.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    future=True,
    connect_args={"sslmode": "require"} if "sslmode" not in DATABASE_URL else {}
)
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
