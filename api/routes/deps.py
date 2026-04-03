from __future__ import annotations

from flask import current_app

from services.measurement_type_service import MeasurementTypeService
from services.user_service import UserService


def get_user_service() -> UserService:
    # Recupera factory de servico registrada no app factory e instancia
    # o servico sob demanda para manter desacoplamento das rotas.
    return current_app.extensions["get_user_service"]()


def get_measurement_type_service() -> MeasurementTypeService:
    # Mesmo padrao de injecao para o servico de tipos de medida.
    # Facilita testes (mock/stub) e evita import circular nas rotas.
    return current_app.extensions["get_measurement_type_service"]()
