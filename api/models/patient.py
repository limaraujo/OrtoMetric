from extensions.db import db
import enum

class SexEnum(enum.Enum):
    M = 'M'
    F = 'F'
    O = 'O'  # Other 
    P = 'P'  # Prefer not to say

class Patient(db.Model):
    __tablename__ = 'patient'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    sex = db.Column(db.Enum(SexEnum), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    encounters = db.relationship('Encounter', back_populates='patient', cascade='all, delete-orphan')