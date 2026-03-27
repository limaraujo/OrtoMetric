import os
import logging
from datetime import timedelta

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from routes.auth import auth_bp
from routes.registry import registry_bp
from extensions.db import db
from extensions.limiter import limiter
import models

app = Flask(__name__)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
env_mode = os.getenv("FLASK_ENV", "development")
if env_mode == "production" and not os.getenv("JWT_SECRET_KEY"):
    raise ValueError("JWT_SECRET_KEY must be set in production environment")

app.config['JWT_SECRET_KEY'] = os.getenv(
    'JWT_SECRET_KEY',
    'dev-only-jwt-secret-key-with-32-plus-bytes' if env_mode != "production" else None
)

access_token_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30"))
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=access_token_minutes)
app.config["RATELIMIT_STORAGE_URI"] = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

db.init_app(app)
jwt = JWTManager(app)
limiter.init_app(app)

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
)
CORS(app, origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()])

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(registry_bp, url_prefix="/registry")

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the API!"})


@app.after_request
def apply_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    port = int(os.getenv("PORT", "5000"))
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)