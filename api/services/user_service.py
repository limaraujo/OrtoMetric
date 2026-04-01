from __future__ import annotations

from flask_jwt_extended import create_access_token, create_refresh_token

from models.user import User
from repositories.user_repository import UserRepository
from schemas.user_schema import UserCreate, UserLogin, UserResponse, UserUpdate
from services.exceptions import (
    InvalidCredentialsError,
    ProfileConflictError,
    UserAlreadyExistsError,
    UserNotFoundError,
)


class UserService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._repo = user_repo

    def create_user(self, user_create: UserCreate) -> UserResponse:
        if self._repo.get_by_email(user_create.email):
            raise UserAlreadyExistsError("Email already exists")

        user = User()
        user.username = user_create.username
        user.email = user_create.email
        user.set_password(user_create.password)

        self._repo.add(user)
        self._repo.commit()
        return UserResponse(id=user.id, username=user.username, email=user.email)

    def login_user(self, data: UserLogin) -> tuple[User, str, str]:
        user = self._repo.get_by_email(data.email)

        if not user or not user.check_password(data.password):
            raise InvalidCredentialsError("Invalid email or password")

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return user, access_token, refresh_token

    def get_profile(self, user_id: int) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        return UserResponse(id=user.id, username=user.username, email=user.email)

    def update_profile(self, user_id: int, data: UserUpdate) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")

        if data.username is not None and data.username != user.username:
            if self._repo.find_username_conflict(data.username, user.id):
                raise ProfileConflictError("Username already exists")
            user.username = data.username

        if data.email is not None and data.email != user.email:
            if self._repo.find_email_conflict(str(data.email), user.id):
                raise ProfileConflictError("Email already exists")
            user.email = data.email

        self._repo.commit()
        return UserResponse(id=user.id, username=user.username, email=user.email)
