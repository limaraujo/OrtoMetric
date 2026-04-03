from pydantic import BaseModel, Field, field_validator


class SeverityIntervalSchema(BaseModel):
    # Faixa de severidade exibida na UI para interpretar o valor medido.
    id: str = Field(..., min_length=1, max_length=120)
    label: str = Field(..., min_length=1, max_length=80)
    min: float
    max: float
    color: str = Field(..., min_length=3, max_length=20)


class MeasurementTypeSchema(BaseModel):
    # Contrato de um tipo de medicao trafegado entre frontend e backend.
    id: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=2, max_length=120)
    baseType: str = Field(..., min_length=3, max_length=20)
    cid: str = Field(default="", max_length=20)
    unit: str = Field(default="", max_length=40)
    desc: str = Field(default="", max_length=500)
    createdAt: str = Field(..., min_length=1, max_length=40)
    severities: list[SeverityIntervalSchema] = []

    @field_validator("baseType")
    @classmethod
    def validate_base_type(cls, value: str) -> str:
        # Restringe dominio para tipos suportados pelo motor de medicao.
        allowed = {"angulo", "distancia", "proporcao"}
        if value not in allowed:
            raise ValueError("baseType inválido")
        return value

    @field_validator("cid")
    @classmethod
    def normalize_cid(cls, value: str) -> str:
        # Normaliza para comparacao/armazenamento consistente.
        return value.strip().upper()


class MeasurementTypeSyncPayload(BaseModel):
    types: list[MeasurementTypeSchema] = []
