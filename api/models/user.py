from extensions.db import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    # Entidade de autenticacao e perfil basico do usuario.
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    def set_password(self, password: str) -> None:
        # Persiste apenas hash derivado da senha, nunca senha em texto puro.
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        # Compara senha informada com hash armazenado de forma segura.
        return check_password_hash(self.password_hash, password)
    