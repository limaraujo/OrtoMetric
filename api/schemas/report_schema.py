from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ReportPointSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=120)
    x: float
    y: float


class ReportLineSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=120)
    start: ReportPointSchema
    end: ReportPointSchema


class ReportSeveritySchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=120)
    label: str = Field(..., min_length=1, max_length=80)
    min: float
    max: float
    color: str = Field(default="#000000", min_length=3, max_length=20)


class ReportMeasurementTypeSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=1, max_length=120)
    baseType: str = Field(..., min_length=3, max_length=20)
    unitMeasure: str = Field(default="", max_length=40)
    cid: str = Field(default="", max_length=20)
    desc: str = Field(default="", max_length=500)
    createdAt: str | None = Field(default=None, max_length=60)
    severities: list[ReportSeveritySchema] = Field(default_factory=lambda: [])


class ReportDistanceCalibrationSchema(BaseModel):
    pixelsPerUnit: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=20)


class ReportMeasurementSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=120)
    measurementTypeId: str = Field(..., min_length=1, max_length=120)
    timestamp: datetime | str | None = None

    upperLine: ReportLineSchema | None = None
    lowerLine: ReportLineSchema | None = None
    angle: float | None = None

    line: ReportLineSchema | None = None
    distance: float | None = None

    details: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_measurement_kind(self):
        is_cobb = self.upperLine is not None and self.lowerLine is not None and self.angle is not None
        is_distance = self.line is not None and self.distance is not None

        if not is_cobb and not is_distance:
            raise ValueError(
                "measurement deve conter estrutura Cobb (upperLine/lowerLine/angle) ou distancia (line/distance)"
            )

        return self


class ReportPatientSchema(BaseModel):
    fullName: str = Field(default="", max_length=200)
    birthDate: str = Field(default="", max_length=60)
    age: str = Field(default="", max_length=30)
    sex: str = Field(default="", max_length=30)
    document: str = Field(default="", max_length=80)


class ReportExamSchema(BaseModel):
    type: str = Field(default="", max_length=120)
    region: str = Field(default="", max_length=120)
    motivation: str = Field(default="", max_length=300)


class ReportDoctorSchema(BaseModel):
    fullName: str = Field(default="", max_length=200)
    CRM: str = Field(default="", max_length=60)
    specialty: str = Field(default="", max_length=120)


class ReportMeasurementSelectionSchema(BaseModel):
    include: bool = True
    includeValue: bool = True
    includeTimestamp: bool = True
    includeCid: bool = True
    includeDescription: bool = True
    includeSeverity: bool = True
    includeDetails: bool = True
    details: str = Field(default="", max_length=1000)


class ReportOptionsSchema(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    author: str | None = Field(default=None, max_length=120)
    conclusions: str | None = Field(default=None, max_length=5000)

    includeImage: bool = True
    includeSummary: bool = True
    includeScale: bool = True

    patient: ReportPatientSchema = Field(default_factory=ReportPatientSchema)
    exam: ReportExamSchema = Field(default_factory=ReportExamSchema)
    doctor: ReportDoctorSchema = Field(default_factory=ReportDoctorSchema)
    fieldsByMeasurementId: dict[str, ReportMeasurementSelectionSchema] = Field(default_factory=dict)


class ReportPayloadSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    imageName: str | None = Field(default=None, max_length=255)
    measurements: list[ReportMeasurementSchema] = Field(default_factory=lambda: [])
    types: list[ReportMeasurementTypeSchema] = Field(default_factory=lambda: [])
    distanceCalibration: ReportDistanceCalibrationSchema | None = None
    imageDataUrl: str | None = None
    options: ReportOptionsSchema = Field(default_factory=ReportOptionsSchema)

    @field_validator("imageDataUrl")
    @classmethod
    def validate_image_data_url(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return value
        if not value.startswith("data:image/"):
            raise ValueError("imageDataUrl deve ser um data URL de imagem")
        return value

    @model_validator(mode="after")
    def validate_calibration_for_distance(self):
        if self.distanceCalibration is None:
            return self

        has_distance = any(
            measurement.line is not None and measurement.distance is not None
            for measurement in self.measurements
        )
        if not has_distance:
            raise ValueError("distanceCalibration informado sem medicao de distancia")

        return self

    @field_validator("measurements")
    @classmethod
    def validate_unique_measurement_ids(
        cls,
        measurements: list[ReportMeasurementSchema],
    ) -> list[ReportMeasurementSchema]:
        seen_ids: set[str] = set()
        for measurement in measurements:
            if measurement.id in seen_ids:
                raise ValueError(f"measurement id duplicado: {measurement.id}")
            seen_ids.add(measurement.id)
        return measurements

    @field_validator("types")
    @classmethod
    def validate_unique_type_ids(
        cls,
        types: list[ReportMeasurementTypeSchema],
    ) -> list[ReportMeasurementTypeSchema]:
        seen_ids: set[str] = set()
        for measurement_type in types:
            normalized = measurement_type.id.strip().lower()
            if normalized in seen_ids:
                raise ValueError(f"type id duplicado: {measurement_type.id}")
            seen_ids.add(normalized)
        return types


def report_payload_to_dict(payload: ReportPayloadSchema) -> dict[str, Any]:
    return payload.model_dump(mode="python", exclude_none=True)
