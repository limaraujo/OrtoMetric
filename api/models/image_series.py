from extensions.db import db

# image_series.py
import enum

class LateralityEnum(enum.Enum):
    LEFT = 'left'
    RIGHT = 'right'
    BILATERAL = 'bilateral'
    NONE = 'none'

# image_series.py
class ImageSeries(db.Model):
    __tablename__ = 'image_series'
    id = db.Column(db.Integer, primary_key=True)
    encounter_id = db.Column(db.Integer, db.ForeignKey('encounter.id'), nullable=False)
    body_part = db.Column(db.String(100), nullable=False)
    performed_at = db.Column(db.DateTime, nullable=False)
    
    # Relationships
    encounter = db.relationship('Encounter', back_populates='image_series')
    image_instances = db.relationship('ImageInstance', back_populates='image_series')
    measurements = db.relationship('Measurement', back_populates='series')
    report = db.relationship('Report', back_populates='series', uselist=False)