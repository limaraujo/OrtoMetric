from extensions.db import db

# measurement_type.py
class MeasurementType(db.Model):
    __tablename__ = 'measurement_type'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)