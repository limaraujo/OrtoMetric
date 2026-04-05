from uuid import uuid4


def _create_user_and_login(client):
    suffix = uuid4().hex[:8]
    remote_addr = f"10.0.1.{int(suffix[:2], 16) % 250 + 1}"
    username = f"report-{suffix}"
    email = f"{username}@test.com"
    password = "TestPass@123"

    register_res = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": password},
        environ_overrides={"REMOTE_ADDR": remote_addr},
    )
    assert register_res.status_code == 201

    login_res = client.post(
        "/auth/login",
        json={"email": email, "password": password},
        environ_overrides={"REMOTE_ADDR": remote_addr},
    )
    assert login_res.status_code == 200


def _csrf_header(client) -> dict[str, str]:
    csrf_access = client.get_cookie("csrf_access_token")
    return {"X-CSRF-TOKEN": csrf_access.value if csrf_access else ""}


def _sample_payload() -> dict:
    return {
        "imageName": "rx_coluna.png",
        "measurements": [
            {
                "id": "m-1",
                "upperLine": {
                    "id": "l-1",
                    "start": {"x": 10, "y": 20, "id": "p-1"},
                    "end": {"x": 30, "y": 40, "id": "p-2"},
                },
                "lowerLine": {
                    "id": "l-2",
                    "start": {"x": 12, "y": 22, "id": "p-3"},
                    "end": {"x": 32, "y": 42, "id": "p-4"},
                },
                "measurementTypeId": "default-angle",
                "angle": 18.4,
                "timestamp": "2026-04-04T12:30:00.000Z",
            },
            {
                "id": "m-2",
                "line": {
                    "id": "l-3",
                    "start": {"x": 5, "y": 5, "id": "p-5"},
                    "end": {"x": 55, "y": 5, "id": "p-6"},
                },
                "measurementTypeId": "default-distance",
                "distance": 120.0,
                "timestamp": "2026-04-04T12:32:00.000Z",
            },
        ],
        "types": [
            {
                "id": "default-angle",
                "name": "Angulo de Cobb",
                "baseType": "angulo",
                "unitMeasure": "°",
                "cid": "M41",
                "desc": "Medicao angular",
                "createdAt": "predefinido",
                "severities": [
                    {"id": "s1", "label": "Leve", "min": 10, "max": 20, "color": "#1D9E75"}
                ],
            },
            {
                "id": "default-distance",
                "name": "Distancia",
                "baseType": "distancia",
                "unitMeasure": "mm",
                "cid": "",
                "desc": "Medicao linear",
                "createdAt": "predefinido",
                "severities": [],
            },
        ],
        "distanceCalibration": {"pixelsPerUnit": 10.0, "unit": "mm"},
        "imageDataUrl": None,
        "options": {
            "title": "Relatorio Clinico",
            "author": "Dr. Teste",
            "patient": {
                "fullName": "Paciente Teste",
                "birthDate": "01/01/2000",
                "sex": "female",
                "document": "123456789",
            },
            "exam": {
                "type": "Raio-X",
                "region": "Coluna",
                "motivation": "Avaliacao postural",
            },
            "doctor": {
                "fullName": "Dra. Exemplo",
                "CRM": "12345",
                "specialty": "Ortopedia",
            },
            "includeImage": False,
            "includeSummary": True,
            "includeScale": True,
            "fieldsByMeasurementId": {
                "m-1": {
                    "include": True,
                    "includeValue": True,
                    "includeTimestamp": True,
                    "includeCid": True,
                    "includeDescription": True,
                    "includeSeverity": True,
                    "includeDetails": True,
                    "details": "Observacao de teste",
                },
                "m-2": {
                    "include": True,
                    "includeValue": True,
                    "includeTimestamp": True,
                    "includeCid": False,
                    "includeDescription": False,
                    "includeSeverity": False,
                    "includeDetails": False,
                    "details": "",
                },
            },
        },
    }


def test_export_txt_report(client):
    _create_user_and_login(client)

    response = client.post(
        "/reports/txt",
        json=_sample_payload(),
        headers=_csrf_header(client),
    )

    assert response.status_code == 200
    assert response.mimetype.startswith("text/plain")
    assert "attachment; filename=\"rx_coluna.txt\"" in response.headers.get(
        "Content-Disposition", ""
    )

    text = response.get_data(as_text=True)
    assert "RELATORIO DE MEDICOES - ORTOMETRIC" in text
    assert "#1 - Angulo de Cobb" in text
    assert "#2 - Distancia" in text
    assert "ESCALA ATIVA" in text


def test_export_pdf_report(client):
    _create_user_and_login(client)

    response = client.post(
        "/reports/pdf",
        json=_sample_payload(),
        headers=_csrf_header(client),
    )

    assert response.status_code == 200
    assert response.mimetype == "application/pdf"
    assert "attachment; filename=\"rx_coluna.pdf\"" in response.headers.get(
        "Content-Disposition", ""
    )

    body = response.get_data()
    assert body.startswith(b"%PDF")
    assert len(body) > 1000
