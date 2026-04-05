from __future__ import annotations

from typing import Mapping
import os


def _normalize_database_url(database_url: str) -> str:
    # Compatibilidade com Render/Heroku antigos
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)

    # Força o driver psycopg (v3) e evita fallback para psycopg2
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    if database_url.startswith("postgresql+psycopg2://"):
        return database_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

    return database_url


def resolve_database_url(config_overrides: Mapping[str, object] | None = None) -> str:
    override_database_url = None

    if config_overrides is not None:
        override_value = config_overrides.get("SQLALCHEMY_DATABASE_URI")
        if override_value:
            override_database_url = str(override_value)

    database_url = override_database_url or os.getenv("DATABASE_URL")

    # 🔴 não deixa o app subir sem DB, mas erro mais claro
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL não configurada no ambiente (Render/Prod)"
        )

    return _normalize_database_url(database_url)


def validate_production_database(database_url: str, *, is_testing: bool) -> None:
    # Mantém leve e sem travar deploy
    if is_testing:
        return

    env_mode = os.getenv("FLASK_ENV", "development")

    # Apenas warning, não bloqueia startup
    if env_mode == "production":
        if not database_url.startswith("postgresql://") and not database_url.startswith(
            "postgresql+psycopg://"
        ):
            print("[WARN] DATABASE_URL não parece PostgreSQL")

        if "sslmode=require" not in database_url:
            print("[WARN] sslmode=require não encontrado na DATABASE_URL (pode ser opcional no Render)")