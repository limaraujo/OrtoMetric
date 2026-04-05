from pydantic import BaseModel, Field, field_validator, model_validator

class SeverityIntervalSchema(BaseModel):
    # Faixa de severidade exibida na UI para interpretar o valor medido.
    id: str = Field(..., min_length=1, max_length=120)
    label: str = Field(..., min_length=1, max_length=80)
    min: float
    max: float
    color: str = Field(..., min_length=3, max_length=20)
    
    @model_validator(mode="after")
    def validate_interval(self):
        if self.min >= self.max:
            raise ValueError("min must be less than max")
        return self



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
        allowed = {"angulo", "distancia"}
        if value not in allowed:
            raise ValueError("baseType inválido")
        return value

    @field_validator("cid")
    @classmethod
    def normalize_cid(cls, value: str) -> str:
        # Normaliza para comparacao/armazenamento consistente.
        return value.strip().upper()

    @model_validator(mode="after")
    def validate_severities(self):
        # Evita IDs duplicados e faixas sobrepostas dentro do mesmo tipo.
        seen_ids: set[str] = set()
        ordered = sorted(self.severities, key=lambda sev: sev.min)

        for severity in ordered:
            norm_id = severity.id.strip().lower()
            if norm_id in seen_ids:
                raise ValueError(f"severity id '{severity.id}' aparece mais de uma vez")
            seen_ids.add(norm_id)

        for previous, current in zip(ordered, ordered[1:]):
            if previous.max > current.min:
                raise ValueError(
                    "severity intervals cannot overlap"
                )

        return self


class MeasurementTypeSyncPayload(BaseModel):
    types: list[MeasurementTypeSchema] = Field(default_factory=list) #type: ignore
    
    @model_validator(mode="after")
    def model_valid(self):
        seen_ids: set[str] = set()
        seen_names: set[str] = set()

        for t in self.types:
            norm_id = t.id.lower()
            norm_name = t.name.lower()

            if norm_id in seen_ids:
                raise ValueError(f"ID '{t.id}' de MeasurementType aparece mais de uma vez")
            seen_ids.add(norm_id)

            if norm_name in seen_names:
                raise ValueError(f"name '{t.name}' de MeasurementType aparece mais de uma vez")
            seen_names.add(norm_name)

        return self

