import pytest
from uuid import uuid4


# Helper para evitar repetição
def create_user_and_login(client):
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "TestPass@123"  # ✅ Senha válida: maiúscula, minúscula, número, especial

    # register
    res = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )
    assert res.status_code == 201

    # login
    res = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert res.status_code == 200
    return res


def test_register(client):
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "SecurePass@456"  # ✅ Senha válida

    res = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )

    assert res.status_code == 201


def test_login(client):
    res = create_user_and_login(client)
    assert res.status_code == 200
    assert client.get_cookie("access_token_cookie") is not None
    assert client.get_cookie("refresh_token_cookie") is not None


def test_protected_route(client):
    create_user_and_login(client)

    res = client.get("/auth/me")

    assert res.status_code == 200


def test_refresh_route(client):
    create_user_and_login(client)
    csrf_refresh = client.get_cookie("csrf_refresh_token")

    res = client.post(
        "/auth/refresh",
        json={},
        headers={"X-CSRF-TOKEN": csrf_refresh.value if csrf_refresh else ""},
    )

    assert res.status_code == 200


def test_logout_clears_session(client):
    create_user_and_login(client)
    res = client.post("/auth/logout", json={})
    assert res.status_code == 200

    me_res = client.get("/auth/me")
    assert me_res.status_code == 401


def test_invalid_login(client):
    res = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword",
        },
    )

    assert res.status_code == 401
