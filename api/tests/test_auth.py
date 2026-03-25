import pytest
from uuid import uuid4
from app import app
from extensions.db import db


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client


# 🔹 helper para evitar repetição
def create_user_and_get_token(client):
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "TestPass@123"  # ✅ Senha válida: maiúscula, minúscula, número, especial

    # register
    res = client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert res.status_code == 201

    # login
    res = client.post("/auth/login", json={
        "email": email,
        "password": password
    })
    data = res.get_json()
    assert "access_token" in data

    return data["access_token"]


def test_register(client):
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "SecurePass@456"  # ✅ Senha válida

    res = client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })

    assert res.status_code == 201


def test_login(client):
    token = create_user_and_get_token(client)
    assert token is not None


def test_protected_route(client):
    token = create_user_and_get_token(client)

    res = client.get("/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })

    assert res.status_code == 200


def test_invalid_login(client):
    res = client.post("/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })

    assert res.status_code == 401