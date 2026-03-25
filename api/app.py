import os

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from routes.auth import auth_bp
from extensions.db import db

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['JWT_SECRET_KEY'] = os.getenv(
    'JWT_SECRET_KEY',
    'dev-only-jwt-secret-key-with-32-plus-bytes'
)

db.init_app(app)
jwt = JWTManager(app)

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
)
CORS(app, origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()])

app.register_blueprint(auth_bp, url_prefix="/auth")

with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the API!"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)