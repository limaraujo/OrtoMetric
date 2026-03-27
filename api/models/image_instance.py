from extensions.db import db

# image_instance.py
class ImageInstance(db.Model):
    __tablename__ = 'image_instance'
    id = db.Column(db.Integer, primary_key=True)
    series_id = db.Column(db.Integer, db.ForeignKey('image_series.id'), nullable=False)
    file_uri = db.Column(db.String(512), nullable=False)
    acquired_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    image_series = db.relationship('ImageSeries', back_populates='image_instances')
    annotations = db.relationship('Annotation', back_populates='image')