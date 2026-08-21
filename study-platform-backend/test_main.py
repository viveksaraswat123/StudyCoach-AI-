import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
import main

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


main.app.dependency_overrides[get_db] = override_get_db
client = TestClient(main.app)


def test_register_and_login():
    response = client.post(
        "/api/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 201
    assert "access_token" in response.json()

    response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_fails():
    client.post(
        "/api/register",
        json={"email": "wrongpass@example.com", "password": "correctpassword"},
    )
    response = client.post(
        "/api/login",
        data={"username": "wrongpass@example.com", "password": "wrongpassword"},
    )
    assert response.status_code in (400, 401)


def test_protected_route_requires_auth():
    response = client.get("/api/users/me")
    assert response.status_code in (401, 403)
