from extensions.db import db

# measurement.py
class Measurement(db.Model):
    __tablename__ = 'measurement'
    id = db.Column(db.Integer, primary_key=True)
    series_id = db.Column(db.Integer, db.ForeignKey('image_series.id'), nullable=False)
    measurement_type_id = db.Column(db.Integer, db.ForeignKey('measurement_type.id'), nullable=False)
    measured_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    value = db.Column(db.Float, nullable=False)
    measured_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    
    # Relationships
    series = db.relationship('ImageSeries', back_populates='measurements')
    
    measurement_type = db.relationship('MeasurementType', back_populates='measurements')
    
    measured_by = db.relationship('User', back_populates='measurements')