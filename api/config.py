from __future__ import annotations

from typing import Mapping
import os


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)
    return database_url


def resolve_database_url(config_overrides: Mapping[str, object] | None = None) -> str:
    override_database_url = None
    if config_overrides is not None:
        override_value = config_overrides.get("SQLALCHEMY_DATABASE_URI")
        if override_value:
            override_database_url = str(override_value)

    database_url = override_database_url or os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError(
            "DATABASE_URL must be set (or SQLALCHEMY_DATABASE_URI in config_overrides)"
        )

    return _normalize_database_url(database_url)


def validate_production_database(database_url: str, *, is_testing: bool) -> None:
    if is_testing:
        return

    if not database_url.startswith("postgresql://"):
        raise ValueError("DATABASE_URL must use PostgreSQL (postgresql://)")

    env_mode = os.getenv("FLASK_ENV", "development")
    if env_mode == "production" and "sslmode=require" not in database_url:
        raise ValueError("DATABASE_URL must include sslmode=require in production")
