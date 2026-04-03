import logging
import os
from typing import Any, cast

from flask import Blueprint, jsonify, request
from flask_limiter.errors import RateLimitExceeded
from flask_limiter.util import get_remote_address
from flask_jwt_extended import (
    create_access_token, # type: ignore
    get_jwt_identity,
    jwt_required, # type: ignore
    set_access_cookies, # type: ignore
    set_refresh_cookies,
    unset_jwt_cookies,
)
from pydantic import ValidationError
from extensions.limiter import limiter
from routes.deps import get_user_service
from schemas.user_schema import UserCreate, UserResponse, UserLogin, UserUpdate
from services.exceptions import (
    InvalidCredentialsError,
    ProfileConflictError,
    UserAlreadyExistsError,
    UserNotFoundError,
)


auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)
# Limite de tentativas de login por janela de tempo.
# Pode ser sobrescrito por variavel de ambiente para ajustar politica entre ambientes.
LOGIN_RATE_LIMIT = os.getenv("AUTH_LOGIN_RATE_LIMIT", "10 per minute")


def _json_payload() -> dict[str, Any]:
    raw = request.get_json(silent=True)
    return cast(dict[str, Any], raw) if isinstance(raw, dict) else {}


def _login_rate_limit_key() -> str:
    # Usa email + IP como chave para evitar que um unico IP burle limite
    # alternando contas, e para nao punir todos os usuarios de um mesmo IP
    # sem considerar o identificador de login.
    payload = _json_payload()
    email = str(payload.get("email", "")).strip().lower()
    ip = get_remote_address()
    return f"{ip}:{email}"


def _validation_error_response(err: ValidationError):
    # Padroniza resposta de erro de validacao do Pydantic.
    # Mantem formato consistente para o frontend mapear campos invalidos.
    logger.info("payload_validation_failed")
    return jsonify({"error": err.errors()}), 400


@auth_bp.errorhandler(RateLimitExceeded)
def handle_rate_limit_exceeded(_err: RateLimitExceeded):
    # Handler central para quando qualquer rota deste blueprint excede
    # limite de requisicoes do Flask-Limiter.
    logger.warning("rate_limit_exceeded endpoint=auth")
    return jsonify({"error": "Too many login attempts. Try again later."}), 429


@auth_bp.route("/register", methods=["POST"])
def register():
    # `silent=True` evita exception caso corpo nao seja JSON valido.
    # O fallback para {} permite validacao uniforme pelo schema.
    payload = _json_payload()
    try:
        # Converte e valida payload de criacao de usuario.
        data = UserCreate(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    try:
        # Regra de negocio e persistencia ficam na camada de servico.
        # A rota apenas orquestra entrada/saida HTTP.
        user = get_user_service().create_user(data)
    except UserAlreadyExistsError as e:
        # Erro esperado de dominio (email/usuario ja existente).
        logger.info("register_failed email=%s reason=%s", data.email, str(e))
        return jsonify({"error": str(e)}), 400
    except Exception:
        # Fallback para erro inesperado sem vazar detalhes internos.
        logger.exception("register_unexpected_error")
        return jsonify({"error": "Internal server error"}), 500

    logger.info("register_success email=%s user_id=%s", data.email, user.id)

    return user.model_dump(), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit(LOGIN_RATE_LIMIT, key_func=_login_rate_limit_key)
def login():
    # Rate limit aplicado por decorator usando chave customizada (IP+email).
    payload = _json_payload()
    try:
        # Valida credenciais recebidas (shape e tipos).
        data = UserLogin(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    try:
        # Login retorna usuario autenticado + tokens JWT (access/refresh).
        user, access_token, refresh_token = get_user_service().login_user(data)
    except InvalidCredentialsError as e:
        # Credencial invalida e erro esperado de autenticacao.
        logger.info("login_failed email=%s reason=%s", data.email, str(e))
        return jsonify({"error": str(e)}), 401
    except Exception:
        # Erro inesperado durante autenticacao.
        logger.exception("login_unexpected_error email=%s", data.email)
        return jsonify({"error": "Internal server error"}), 500

    logger.info("login_success email=%s user_id=%s", data.email, user.id)

    response = jsonify(
        {
            # Retorna dados publicos do usuario autenticado.
            # Nao inclui senha/hash ou campos sensiveis.
            "user": UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
            ).model_dump(),
        }
    )
    # Tokens sao enviados em cookies HTTP-only para reduzir exposicao em JS.
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response, 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    # Exige refresh token valido.
    # Gera novo access token sem exigir novo login.
    user_id = str(get_jwt_identity())
    access_token = create_access_token(identity=user_id)
    response = jsonify({"ok": True})
    set_access_cookies(response, access_token)
    logger.info("refresh_success user_id=%s", user_id)
    return response, 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Remove cookies JWT do cliente para encerrar sessao local.
    response = jsonify({"ok": True})
    unset_jwt_cookies(response)
    logger.info("logout_success")
    return response, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    # Endpoint simples para verificar se o token atual e valido
    # e recuperar identidade extraida do JWT.
    user_id = get_jwt_identity()
    logger.info("me_access user_id=%s", user_id)

    return {"user_id": user_id}


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    # Converte identidade para inteiro porque o servico trabalha com ID numerico.
    user_id = int(get_jwt_identity())
    try:
        # Busca dados de perfil agregados pela camada de servico.
        profile = get_user_service().get_profile(user_id)
    except UserNotFoundError:
        # Caso esperado quando usuario nao existe mais na base.
        logger.info("profile_not_found user_id=%s", user_id)
        return jsonify({"error": "User not found"}), 404

    logger.info("profile_read_success user_id=%s", user_id)
    return profile.model_dump(), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    # Usuario autenticado so pode editar o proprio perfil,
    # pois o ID vem do token e nao do corpo da requisicao.
    user_id = int(get_jwt_identity())
    payload = _json_payload()

    try:
        # Valida payload parcial/total de atualizacao de perfil.
        data = UserUpdate(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    try:
        # Aplica regras de atualizacao (unicidade, normalizacao etc.)
        # no servico antes de persistir.
        profile = get_user_service().update_profile(user_id, data)
    except UserNotFoundError:
        logger.info("profile_update_not_found user_id=%s", user_id)
        return jsonify({"error": "User not found"}), 404
    except ProfileConflictError as e:
        # Conflito esperado (ex.: email/username em uso).
        logger.info("profile_update_conflict user_id=%s reason=%s", user_id, str(e))
        return jsonify({"error": str(e)}), 400

    logger.info("profile_update_success user_id=%s", user_id)
    return profile.model_dump(), 200
