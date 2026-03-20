from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from schemas.user_schema import UserCreate, UserResponse, UserLogin
from services.user_service import create_user, login_user


auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try: 
        data = UserCreate(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    try:
        user = create_user(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email
    ).model_dump(), 201
    
@auth_bp.route("/login", methods=["POST"])
def login():
    try: 
        data = UserLogin(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    try:
        user, token = login_user(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

    return {
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email
        ).model_dump(),
        "access_token": token
    }, 200    
    
from flask_jwt_extended import jwt_required, get_jwt_identity

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()

    return {"user_id": user_id}