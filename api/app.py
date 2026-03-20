import os

from flask import Flask, jsonify, request, Blueprint
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

CORS(app, origins=["http://localhost:5173"])

app.register_blueprint(auth_bp, url_prefix="/auth")

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the API!"})