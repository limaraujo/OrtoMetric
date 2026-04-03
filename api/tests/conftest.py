import pytest

from extensions.db import db
from factory import create_app


@pytest.fixture
def app():
    # Objetivo: criar uma aplicacao isolada para testes automatizados.
    # Entrada: nenhuma (fixture de escopo padrao do pytest).
    # Regras: usa banco em memoria e desativa rate limit para evitar flakiness.
    application = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "RATELIMIT_ENABLED": False,
        }
    )

    # Saida: app pronto com schema criado antes de cada uso.
    with application.app_context():
        db.create_all()
    yield application


@pytest.fixture
def client(app):
    # Objetivo: fornecer cliente HTTP de testes para requisicoes contra a API.
    # Saida: instancia de Flask test client vinculada ao app de teste.
    return app.test_client()
