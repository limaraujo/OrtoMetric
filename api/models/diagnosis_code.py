from extensions.db import db

# diagnosis_code.py
class DiagnosisCode(db.Model):
    __tablename__ = 'diagnosis_code'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    system = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    
    report_diagnoses = db.relationship('ReportDiagnosis', back_populates='diagnosis_code')