import logging

from flask import Blueprint, request, jsonify
from flask_limiter.errors import RateLimitExceeded
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError
from extensions.limiter import limiter
from schemas.user_schema import UserCreate, UserResponse, UserLogin
from services.user_service import create_user, login_user
from services.exceptions import UserAlreadyExistsError, InvalidCredentialsError


auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


def _validation_error_response(err: ValidationError):
    logger.info("payload_validation_failed")
    return jsonify({"error": err.errors()}), 400


@auth_bp.errorhandler(RateLimitExceeded)
def handle_rate_limit_exceeded(_err: RateLimitExceeded):
    logger.warning("rate_limit_exceeded endpoint=auth")
    return jsonify({"error": "Too many login attempts. Try again later."}), 429

@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    try: 
        data = UserCreate(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    try:
        user = create_user(data)
    except UserAlreadyExistsError as e:
        logger.info("register_failed email=%s reason=%s", data.email, str(e))
        return jsonify({"error": str(e)}), 400
    except Exception:
        logger.exception("register_unexpected_error")
        return jsonify({"error": "Internal server error"}), 500

    logger.info("register_success email=%s user_id=%s", data.email, user.id)

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email
    ).model_dump(), 201
    
@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    payload = request.get_json(silent=True) or {}
    try: 
        data = UserLogin(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    try:
        user, token = login_user(data)
    except InvalidCredentialsError as e:
        logger.info("login_failed email=%s reason=%s", data.email, str(e))
        return jsonify({"error": str(e)}), 401
    except Exception:
        logger.exception("login_unexpected_error email=%s", data.email)
        return jsonify({"error": "Internal server error"}), 500

    logger.info("login_success email=%s user_id=%s", data.email, user.id)

    return {
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email
        ).model_dump(),
        "access_token": token
    }, 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    logger.info("me_access user_id=%s", user_id)

    return {"user_id": user_id}