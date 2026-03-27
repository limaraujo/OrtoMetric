from extensions.db import db

# report_diagnosis.py
class ReportDiagnosis(db.Model):
    __tablename__ = 'report_diagnosis'
    report_id = db.Column(db.Integer, db.ForeignKey('report.id'), primary_key=True)
    diagnosis_code_id = db.Column(db.Integer, db.ForeignKey('diagnosis_code.id'), primary_key=True)
    report = db.relationship('Report', back_populates='diagnoses')
    diagnosis_code = db.relationship('DiagnosisCode', back_populates='report_diagnoses')