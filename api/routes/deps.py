from __future__ import annotations

from flask import current_app

from services.measurement_type_service import MeasurementTypeService
from services.user_service import UserService


def get_user_service() -> UserService:
    return current_app.extensions["get_user_service"]()


def get_measurement_type_service() -> MeasurementTypeService:
    return current_app.extensions["get_measurement_type_service"]()
