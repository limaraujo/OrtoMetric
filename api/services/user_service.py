from models.user import User
from flask_jwt_extended import create_access_token
from schemas.user_schema import UserCreate, UserResponse, UserLogin
from extensions.db import db

def create_user(user_create: UserCreate) -> UserResponse:
    existing_user = User.query.filter( User.email == user_create.email).first()
    if existing_user:
        raise ValueError("Email already exists")
    user = User()
    user.username = user_create.username
    user.email = user_create.email
    user.set_password(user_create.password)
    
    db.session.add(user)
    db.session.commit()
    return UserResponse(id=user.id, username=user.username, email=user.email)


def login_user(data: UserLogin) -> tuple[User, str]:
    user = User.query.filter(User.email == data.email).first()
    
    if not user or not user.check_password(data.password):
        raise ValueError("Invalid email or password")

    # Flask-JWT-Extended expects the subject claim to be JSON-string-compatible.
    token = create_access_token(identity=str(user.id))
    
    return user, token