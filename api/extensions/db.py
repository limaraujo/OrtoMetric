from flask_sqlalchemy import SQLAlchemy

# Instancia unica do SQLAlchemy compartilhada pelo app factory.
db = SQLAlchemy()