from __future__ import annotations

import logging
import os
from datetime import timedelta
from typing import Mapping

from flask import Flask, Response, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from config import resolve_database_url, validate_production_database
import models  # noqa: F401
from extensions.db import db
from extensions.limiter import limiter
from repositories.measurement_type_repository import MeasurementTypeRepository
from repositories.user_repository import UserRepository
from routes.auth import auth_bp
from routes.measurement_types import measurement_types_bp
from routes.reports import reports_bp
from services.measurement_type_service import MeasurementTypeService
from services.user_service import UserService


def _resolve_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX", "").strip()
    if origin_regex:
        origins.append(origin_regex)

    return origins


def create_app(config_overrides: Mapping[str, object] | None = None) -> Flask:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    app = Flask(__name__)

    env_mode = os.getenv("FLASK_ENV", "development")
    is_testing = bool(config_overrides and config_overrides.get("TESTING"))

    # 🔴 DEBUG CRÍTICO (Render logs)
    print("[BOOT] create_app")
    print("[BOOT] DATABASE_URL =", os.getenv("DATABASE_URL"))
    print("[BOOT] JWT =", bool(os.getenv("JWT_SECRET_KEY")))

    database_url = resolve_database_url(config_overrides)

    validate_production_database(database_url, is_testing=is_testing)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}

    jwt_secret = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")

    if env_mode == "production" and not jwt_secret:
        raise RuntimeError("JWT_SECRET_KEY não configurado em produção")

    app.config["JWT_SECRET_KEY"] = jwt_secret or "dev-only-secret"

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30"))
    )
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    )

    app.config["RATELIMIT_STORAGE_URI"] = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

    cookie_samesite_default = "None" if env_mode == "production" else "Lax"
    app.config["JWT_COOKIE_SAMESITE"] = os.getenv(
        "JWT_COOKIE_SAMESITE", cookie_samesite_default
    )

    cookie_secure_default = env_mode == "production"
    cookie_secure_env = os.getenv("JWT_COOKIE_SECURE")

    app.config["JWT_COOKIE_SECURE"] = (
        cookie_secure_default
        if cookie_secure_env is None
        else cookie_secure_env.lower() in {"1", "true", "yes", "on"}
    )

    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True

    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    limiter.init_app(app)

    CORS(
        app,
        origins=_resolve_cors_origins(),
        supports_credentials=True,
    )

    def get_user_service() -> UserService:
        return UserService(UserRepository(db))

    def get_measurement_type_service() -> MeasurementTypeService:
        return MeasurementTypeService(MeasurementTypeRepository(db))

    app.extensions["get_user_service"] = get_user_service
    app.extensions["get_measurement_type_service"] = get_measurement_type_service

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(measurement_types_bp, url_prefix="/measurement-types")
    app.register_blueprint(reports_bp, url_prefix="/reports")

    @app.route("/")
    def home():
        return jsonify({"message": "API running"})

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.after_request
    def apply_security_headers(response: Response) -> Response:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

    return app