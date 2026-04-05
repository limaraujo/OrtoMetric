from __future__ import annotations

from typing import Mapping
import os
import socket
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _sanitize_database_url(database_url: str) -> str:
    # Erro comum de colar "DATABASE_URL=..." dentro do valor da propria variavel.
    if database_url.startswith("DATABASE_URL="):
        return database_url[len("DATABASE_URL="):]

    # Tambem aceita valor colado como "DATABASE_URL_IPV4=...".
    if database_url.startswith("DATABASE_URL_IPV4="):
        return database_url[len("DATABASE_URL_IPV4="):]
    return database_url


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


def _is_truthy_env(var_name: str, *, default: bool) -> bool:
    raw_value = os.getenv(var_name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _apply_ipv4_hostaddr(database_url: str) -> str:
    try:
        parsed = urlsplit(database_url)
    except Exception:
        return database_url

    if not parsed.scheme.startswith("postgresql"):
        return database_url

    hostname = parsed.hostname
    if not hostname:
        return database_url

    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    if any(key == "hostaddr" for key, _ in query_pairs):
        return database_url

    # Tenta IPv4 primeiro
    try:
        ipv4_results = socket.getaddrinfo(
            hostname,
            parsed.port or 5432,
            family=socket.AF_INET,
            type=socket.SOCK_STREAM,
        )
        if ipv4_results:
            hostaddr = str(ipv4_results[0][4][0])
            query_pairs.append(("hostaddr", hostaddr))
            print(f"[INFO] Forçando IPv4: {hostaddr}")
            updated_query = urlencode(query_pairs)
            return urlunsplit((
                parsed.scheme, parsed.netloc,
                parsed.path, updated_query, parsed.fragment,
            ))
    except socket.gaierror as e:
        print(f"[WARN] Falha ao resolver IPv4: {e}")

    # Fallback: tenta qualquer família e pega o primeiro IPv4 disponível
    try:
        all_results = socket.getaddrinfo(
            hostname,
            parsed.port or 5432,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
        )
        for result in all_results:
            # AF_INET = IPv4
            if result[0] == socket.AF_INET:
                hostaddr = str(result[4][0])
                query_pairs.append(("hostaddr", hostaddr))
                print(f"[INFO] IPv4 encontrado via AF_UNSPEC: {hostaddr}")
                updated_query = urlencode(query_pairs)
                return urlunsplit((
                    parsed.scheme, parsed.netloc,
                    parsed.path, updated_query, parsed.fragment,
                ))
        print("[WARN] Nenhum endereço IPv4 disponível, usando URL original")
    except socket.gaierror as e:
        print(f"[WARN] Falha total na resolução DNS: {e}")

    return database_url


def resolve_database_url(config_overrides: Mapping[str, object] | None = None) -> str:
    override_database_url = None

    if config_overrides is not None:
        override_value = config_overrides.get("SQLALCHEMY_DATABASE_URI")
        if override_value:
            override_database_url = str(override_value)

    database_url = (
        override_database_url
        or os.getenv("DATABASE_URL")
        or os.getenv("DATABASE_URL_IPV4")
    )

    # 🔴 não deixa o app subir sem DB, mas erro mais claro
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL não configurada no ambiente (Render/Prod)"
        )

    sanitized_url = _sanitize_database_url(database_url)
    normalized_url = _normalize_database_url(sanitized_url)
    env_mode = os.getenv("FLASK_ENV", "development")
    force_ipv4 = _is_truthy_env("DB_FORCE_IPV4", default=env_mode == "production")

    if force_ipv4:
        # Permite URL alternativa já em endpoint IPv4 (ex.: Supabase pooler).
        database_url_ipv4 = os.getenv("DATABASE_URL_IPV4", "").strip()
        if database_url_ipv4:
            return _normalize_database_url(_sanitize_database_url(database_url_ipv4))

        resolved_url = _apply_ipv4_hostaddr(normalized_url)
        if resolved_url == normalized_url:
            raise RuntimeError(
                "DB_FORCE_IPV4 ativo, mas o host de DATABASE_URL nao possui IPv4 resolvivel neste ambiente. "
                "Defina DATABASE_URL_IPV4 com endpoint pooler IPv4 (Supabase Session/Transaction Pooler)."
            )
        normalized_url = resolved_url

    return normalized_url


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