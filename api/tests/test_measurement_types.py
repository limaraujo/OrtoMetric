from uuid import uuid4


def create_user_and_login(client):
    # Objetivo: preparar sessao autenticada para cenarios de measurement types.
    # Regras: usa IP pseudo-aleatorio para evitar colisoes em rate limit por IP+email.
    suffix = uuid4().hex[:8]
    remote_addr = f"10.0.0.{int(suffix[:2], 16) % 250 + 1}"
    username = f"test-{suffix}"
    email = f"{username}@test.com"
    password = "TestPass@123"

    res = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": password},
        environ_overrides={"REMOTE_ADDR": remote_addr},
    )
    assert res.status_code == 201

    res = client.post(
        "/auth/login",
        json={"email": email, "password": password},
        environ_overrides={"REMOTE_ADDR": remote_addr},
    )
    assert res.status_code == 200


def test_measurement_types_get_defaults(client):
    # Objetivo: confirmar entrega do catalogo padrao para usuario autenticado.
    create_user_and_login(client)

    res = client.get("/measurement-types")

    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert any(item["id"] == "default-cobb-angle" for item in data)


def test_measurement_types_sync_and_read(client):
    # Objetivo: validar sincronizacao full-snapshot e leitura subsequente.
    # Entrada: um tipo padrao editado + um tipo customizado.
    create_user_and_login(client)

    custom_item = {
        "id": "custom-angle-a",
        "name": "Ângulo toracolombar",
        "baseType": "angulo",
        "unit": "graus",
        "desc": "Medição personalizada",
        "createdAt": "31/03/2026",
        "severities": [
            {"id": "x1", "label": "Leve", "min": 0, "max": 20, "color": "#1D9E75"}
        ],
    }

    edited_default = {
        "id": "default-cobb-angle",
        "name": "Ângulo de Cobb (Editado)",
        "baseType": "angulo",
        "unit": "graus",
        "desc": "Ajuste da equipe médica",
        "createdAt": "predefinido",
        "severities": [
            {"id": "s1", "label": "Normal", "min": 0, "max": 8, "color": "#1D9E75"},
            {"id": "s2", "label": "Leve", "min": 8, "max": 20, "color": "#BA7517"},
        ],
    }

    csrf_access = client.get_cookie("csrf_access_token")

    sync_res = client.put(
        "/measurement-types/sync",
        json={"types": [edited_default, custom_item]},
        headers={"X-CSRF-TOKEN": csrf_access.value if csrf_access else ""},
    )

    # Saida esperada: sync persiste e leitura retorna os itens atualizados.
    assert sync_res.status_code == 200

    list_res = client.get("/measurement-types")
    assert list_res.status_code == 200

    items = list_res.get_json()
    by_id = {item["id"]: item for item in items}

    assert by_id["default-cobb-angle"]["name"] == "Ângulo de Cobb (Editado)"
    assert by_id["custom-angle-a"]["name"] == "Ângulo toracolombar"
