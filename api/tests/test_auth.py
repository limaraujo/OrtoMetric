import pytest
from uuid import uuid4


def create_user_and_login(client):
    # Objetivo: reduzir repeticao do fluxo base de autenticacao para os testes.
    # Entrada: cliente HTTP de teste autenticado por fixture.
    # Regras: cadastra usuario unico e realiza login em seguida.
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "TestPass@123"

    # Saida intermediaria: cadastro precisa ser criado com sucesso.
    res = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )
    assert res.status_code == 201

    # Saida final: login retorna 200 e fixa cookies de sessao no client.
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
    # Objetivo: validar que cadastro com payload valido cria usuario.
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "SecurePass@456"

    res = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )

    assert res.status_code == 201


def test_register_with_weak_password_returns_400(client):
    # Objetivo: validar retorno 400 para senha fora da politica de complexidade.
    suffix = uuid4().hex[:8]
    username = f"test-{suffix}"
    email = f"{username}@test.com"

    res = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "testeteste",
        },
    )

    assert res.status_code == 400


def test_login(client):
    # Objetivo: garantir login valido e emissao de cookies JWT.
    res = create_user_and_login(client)
    assert res.status_code == 200
    assert client.get_cookie("access_token_cookie") is not None
    assert client.get_cookie("refresh_token_cookie") is not None


def test_protected_route(client):
    # Objetivo: verificar acesso a rota protegida apos autenticacao.
    create_user_and_login(client)

    res = client.get("/auth/me")

    assert res.status_code == 200


def test_refresh_route(client):
    # Objetivo: validar renovacao de access token via refresh token + CSRF.
    create_user_and_login(client)
    csrf_refresh = client.get_cookie("csrf_refresh_token")

    res = client.post(
        "/auth/refresh",
        json={},
        headers={"X-CSRF-TOKEN": csrf_refresh.value if csrf_refresh else ""},
    )

    assert res.status_code == 200


def test_logout_clears_session(client):
    # Objetivo: garantir que logout remove sessao e bloqueia rota protegida.
    create_user_and_login(client)
    res = client.post("/auth/logout", json={})
    assert res.status_code == 200

    me_res = client.get("/auth/me")
    assert me_res.status_code == 401


def test_invalid_login(client):
    # Objetivo: impedir autenticacao com credenciais invalidas.
    # Erros: resposta deve ser 401 sem criar sessao autenticada.
    res = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword",
        },
    )

    assert res.status_code == 401
