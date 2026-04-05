from __future__ import annotations

import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool


load_dotenv()


def _build_pooler_url() -> str:
    user = os.getenv("SUPABASE_POOLER_USER", "").strip()
    password = os.getenv("SUPABASE_POOLER_PASSWORD", "").strip()
    host = os.getenv("SUPABASE_POOLER_HOST", "").strip()
    port = os.getenv("SUPABASE_POOLER_PORT", "6543").strip()
    dbname = os.getenv("SUPABASE_POOLER_DBNAME", "postgres").strip()

    missing = [
        name
        for name, value in {
            "SUPABASE_POOLER_USER": user,
            "SUPABASE_POOLER_PASSWORD": password,
            "SUPABASE_POOLER_HOST": host,
            "SUPABASE_POOLER_PORT": port,
            "SUPABASE_POOLER_DBNAME": dbname,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing required .env values: " + ", ".join(missing)
        )

    encoded_password = quote_plus(password)
    return (
        f"postgresql+psycopg://{user}:{encoded_password}@{host}:{port}/{dbname}"
        "?sslmode=require"
    )


def main() -> None:
    database_url = _build_pooler_url()

    # For pooler endpoints, avoid SQLAlchemy client-side pool interference.
    engine = create_engine(database_url, poolclass=NullPool, pool_pre_ping=True)

    try:
        with engine.connect() as connection:
            one = connection.execute(text("select 1")).scalar_one()
            print("Connection successful! select 1 =", one)
    except Exception as exc:  # pragma: no cover - utility script
        print("Failed to connect:", exc)
        raise


if __name__ == "__main__":
    main()
