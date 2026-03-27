from extensions.db import db

# encounter.py
class Encounter(db.Model):
    __tablename__ = 'encounter'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    start_at = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    patient = db.relationship('Patient', back_populates='encounters')
    image_series = db.relationship('ImageSeries', back_populates='encounter')