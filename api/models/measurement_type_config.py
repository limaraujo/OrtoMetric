from extensions.db import db


class MeasurementTypeOverride(db.Model):
    __tablename__ = "measurement_type_override"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    default_type_id = db.Column(db.String(120), nullable=False)
    payload_json = db.Column(db.Text, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "default_type_id", name="uq_mto_user_default"),
    )


class MeasurementTypeCustom(db.Model):
    __tablename__ = "measurement_type_custom"

    id = db.Column(db.String(120), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    payload_json = db.Column(db.Text, nullable=False)


class MeasurementTypePreference(db.Model):
    __tablename__ = "measurement_type_preference"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True, unique=True)
    active_type_id = db.Column(db.String(120), nullable=True)
