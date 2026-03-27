from extensions.db import db

class MeasurementSeverity(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    measurement_type_id = db.Column(
        db.Integer,
        db.ForeignKey("measurement_type.id"),
        nullable=False
    )

    label = db.Column(db.String(50), nullable=False)
    # ex: leve, moderado, severo

    min_value = db.Column(db.Float, nullable=True)
    max_value = db.Column(db.Float, nullable=True)

    color = db.Column(db.String(20))  # opcional (UI)