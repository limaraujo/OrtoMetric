from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy

from extensions.db import db
from models.user import User


class UserRepository:
    """Acesso a dados de usuário; recebe a extensão Flask-SQLAlchemy explicitamente."""

    def __init__(self, db_ext: SQLAlchemy | None = None) -> None:
        self._db = db_ext or db

    @property
    def session(self):
        return self._db.session

    def get_by_email(self, email: str) -> User | None:
        # Consulta principal usada por registro/login.
        return User.query.filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def find_username_conflict(self, username: str, exclude_user_id: int) -> User | None:
        # Verifica unicidade de username ignorando o proprio usuario em atualizacao.
        return User.query.filter(User.username == username, User.id != exclude_user_id).first()

    def find_email_conflict(self, email: str, exclude_user_id: int) -> User | None:
        # Verifica unicidade de email ignorando o proprio usuario em atualizacao.
        return User.query.filter(User.email == email, User.id != exclude_user_id).first()

    def add(self, user: User) -> None:
        self.session.add(user)

    def commit(self) -> None:
        self.session.commit()
