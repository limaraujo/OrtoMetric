from typing import Any

from extensions.db import db


class MeasurementTypeCatalog(db.Model):
    # Catalogo base de tipos predefinidos compartilhados por todos os usuarios.
    __tablename__ = "measurement_type_catalog"

    id = db.Column(db.String(120), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    base_type = db.Column(db.String(20), nullable=False)
    cid = db.Column(db.String(20), nullable=False, default="")
    unit = db.Column(db.String(40), nullable=False, default="")
    description = db.Column(db.Text, nullable=False, default="")
    created_at_label = db.Column(db.String(40), nullable=False, default="predefinido")
    severities_json = db.Column(db.Text, nullable=False, default="[]")

    def to_payload(self, severities: list[dict[str, Any]]) -> dict[str, Any]:
        # Converte modelo de persistencia para contrato JSON esperado pela API.
        return {
            "id": self.id,
            "name": self.name,
            "baseType": self.base_type,
            "cid": self.cid,
            "unit": self.unit,
            "desc": self.description,
            "createdAt": self.created_at_label,
            "severities": severities,
        }