from extensions.db import db
import enum

class StatusEnum(enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

# report.py
class Report(db.Model):
    __tablename__ = 'report'
    id = db.Column(db.Integer, primary_key=True)
    series_id = db.Column(db.Integer, db.ForeignKey('image_series.id'), nullable=False, unique=True)
    medical_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    findings = db.Column(db.Text, nullable=False)
    impression = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(StatusEnum), default=StatusEnum.PENDING, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    series = db.relationship('ImageSeries', back_populates='report')
    medical_user = db.relationship('User', back_populates='reports')
    diagnoses = db.relationship('ReportDiagnosis', back_populates='report')