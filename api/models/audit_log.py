from extensions.db import db

# audit_log.py
class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    entity_name = db.Column(db.String(100), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(20), nullable=False)  # CREATE, UPDATE, DELETE
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    user = db.relationship('User', back_populates='audit_logs')