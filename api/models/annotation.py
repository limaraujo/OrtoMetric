from extensions.db import db

# annotation.py
class Annotation(db.Model):
    __tablename__ = 'annotation'
    id = db.Column(db.Integer, primary_key=True)
    image_id = db.Column(db.Integer, db.ForeignKey('image_instance.id'), nullable=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    geometry_json = db.Column(db.Text, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    image = db.relationship('ImageInstance', back_populates='annotations')
    created_by = db.relationship('User', back_populates='annotations')