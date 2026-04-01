from __future__ import annotations

import logging
import os
from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

import models  # noqa: F401 — registra modelos no metadata do SQLAlchemy
from extensions.db import db
from extensions.limiter import limiter
from repositories.measurement_type_repository import MeasurementTypeRepository
from repositories.user_repository import UserRepository
from routes.auth import auth_bp
from routes.measurement_types import measurement_types_bp
from services.measurement_type_service import MeasurementTypeService
from services.user_service import UserService


def create_app(config_overrides: dict | None = None) -> Flask:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    env_mode = os.getenv("FLASK_ENV", "development")
    if env_mode == "production" and not os.getenv("JWT_SECRET_KEY"):
        raise ValueError("JWT_SECRET_KEY must be set in production environment")

    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "dev-only-jwt-secret-key-with-32-plus-bytes" if env_mode != "production" else None,
    )

    access_token_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30"))
    refresh_token_days = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=access_token_minutes)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=refresh_token_days)
    app.config["RATELIMIT_STORAGE_URI"] = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True
    app.config["JWT_COOKIE_SECURE"] = env_mode == "production"
    app.config["JWT_COOKIE_SAMESITE"] = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
    app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token_cookie"
    app.config["JWT_ACCESS_CSRF_COOKIE_NAME"] = "csrf_access_token"
    app.config["JWT_REFRESH_CSRF_COOKIE_NAME"] = "csrf_refresh_token"

    if config_overrides:
        app.config.update(config_overrides)

    db.init_app(app)
    JWTManager(app)
    limiter.init_app(app)

    frontend_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174",
    )
    CORS(
        app,
        origins=[
            origin.strip()
            for origin in frontend_origins.split(",")
            if origin.strip()
        ],
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

    @app.route("/")
    def home():
        return jsonify({"message": "Welcome to the API!"})

    @app.after_request
    def apply_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

    return app
