from extensions.db import db

class Measurement(db.Model):
    __tablename__ = 'measurement'

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    measurement_type_id = db.Column(
        db.Integer,
        db.ForeignKey("measurement_type.id"),
        nullable=False
    )

    value = db.Column(db.Float, nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    measured_by = db.relationship('User', back_populates='measurements')