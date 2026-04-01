import logging
import os

from flask import Blueprint, request, jsonify
from flask_limiter.errors import RateLimitExceeded
from flask_limiter.util import get_remote_address
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from pydantic import ValidationError
from extensions.limiter import limiter
from schemas.user_schema import UserCreate, UserResponse, UserLogin, UserUpdate
from models.user import User
from extensions.db import db
from services.user_service import create_user, login_user
from services.exceptions import UserAlreadyExistsError, InvalidCredentialsError


auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)
LOGIN_RATE_LIMIT = os.getenv("AUTH_LOGIN_RATE_LIMIT", "10 per minute")


def _login_rate_limit_key() -> str:
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    ip = get_remote_address()
    return f"{ip}:{email}"


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
@limiter.limit(LOGIN_RATE_LIMIT, key_func=_login_rate_limit_key)
def login():
    payload = request.get_json(silent=True) or {}
    try: 
        data = UserLogin(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    try:
        user, access_token, refresh_token = login_user(data)
    except InvalidCredentialsError as e:
        logger.info("login_failed email=%s reason=%s", data.email, str(e))
        return jsonify({"error": str(e)}), 401
    except Exception:
        logger.exception("login_unexpected_error email=%s", data.email)
        return jsonify({"error": "Internal server error"}), 500

    logger.info("login_success email=%s user_id=%s", data.email, user.id)

    response = jsonify({
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email
        ).model_dump(),
    })
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response, 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = str(get_jwt_identity())
    access_token = create_access_token(identity=user_id)
    response = jsonify({"ok": True})
    set_access_cookies(response, access_token)
    logger.info("refresh_success user_id=%s", user_id)
    return response, 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"ok": True})
    unset_jwt_cookies(response)
    logger.info("logout_success")
    return response, 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    logger.info("me_access user_id=%s", user_id)

    return {"user_id": user_id}


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        logger.info("profile_not_found user_id=%s", user_id)
        return jsonify({"error": "User not found"}), 404

    logger.info("profile_read_success user_id=%s", user_id)
    return UserResponse(id=user.id, username=user.username, email=user.email).model_dump(), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        logger.info("profile_update_not_found user_id=%s", user_id)
        return jsonify({"error": "User not found"}), 404

    payload = request.get_json(silent=True) or {}

    try:
        data = UserUpdate(**payload)
    except ValidationError as e:
        return _validation_error_response(e)

    if data.username is not None and data.username != user.username:
        username_in_use = User.query.filter(
            User.username == data.username,
            User.id != user.id,
        ).first()

        if username_in_use:
            logger.info("profile_update_conflict user_id=%s field=username", user_id)
            return jsonify({"error": "Username already exists"}), 400
        user.username = data.username

    if data.email is not None and data.email != user.email:
        email_in_use = User.query.filter(
            User.email == data.email,
            User.id != user.id,
        ).first()

        if email_in_use:
            logger.info("profile_update_conflict user_id=%s field=email", user_id)
            return jsonify({"error": "Email already exists"}), 400
        user.email = data.email

    db.session.commit()
    logger.info("profile_update_success user_id=%s", user_id)

    return UserResponse(id=user.id, username=user.username, email=user.email).model_dump(), 200