from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_

from extensions.db import db
from models.diagnosis_code import DiagnosisCode
from models.measurement_type import MeasurementType
from models.patient import Patient, SexEnum

registry_bp = Blueprint("registry", __name__)


def _normalize_text(value: str) -> str:
    return value.strip()


def _parse_dob(value: str):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


@registry_bp.route("/patients", methods=["GET"])
@jwt_required()
def list_patients():
    query = request.args.get("q", "").strip()

    patient_query = Patient.query
    if query:
        like = f"%{query}%"
        patient_query = patient_query.filter(
            or_(
                Patient.name.ilike(like),
                Patient.email.ilike(like),
                Patient.phone.ilike(like),
            )
        )

    patients = patient_query.order_by(Patient.name.asc()).all()

    return jsonify(
        [
            {
                "id": patient.id,
                "name": patient.name,
                "dob": patient.dob.isoformat(),
                "sex": patient.sex.value,
                "email": patient.email,
                "phone": patient.phone,
                "address": patient.address,
            }
            for patient in patients
        ]
    )


@registry_bp.route("/patients", methods=["POST"])
@jwt_required()
def create_patient():
    payload = request.get_json(silent=True) or {}

    name = _normalize_text(payload.get("name", ""))
    dob_raw = payload.get("dob", "")
    sex_raw = _normalize_text(payload.get("sex", ""))
    email = _normalize_text(payload.get("email", ""))
    phone = _normalize_text(payload.get("phone", ""))
    address = _normalize_text(payload.get("address", ""))

    if not all([name, dob_raw, sex_raw, email, phone, address]):
        return jsonify({"error": "All patient fields are required."}), 400

    if Patient.query.filter_by(email=email).first():
        return jsonify({"error": "Patient with this email already exists."}), 409

    dob = _parse_dob(dob_raw)
    if not dob:
        return jsonify({"error": "Invalid date. Use YYYY-MM-DD."}), 400

    try:
        sex = SexEnum[sex_raw.upper()]
    except KeyError:
        return jsonify({"error": "Invalid sex. Use M, F, O, or P."}), 400

    patient = Patient(
        name=name,
        dob=dob,
        sex=sex,
        email=email,
        phone=phone,
        address=address,
    )
    db.session.add(patient)
    db.session.commit()

    return (
        jsonify(
            {
                "id": patient.id,
                "name": patient.name,
                "dob": patient.dob.isoformat(),
                "sex": patient.sex.value,
                "email": patient.email,
                "phone": patient.phone,
                "address": patient.address,
            }
        ),
        201,
    )


@registry_bp.route("/measurement-types", methods=["GET"])
@jwt_required()
def list_measurement_types():
    query = request.args.get("q", "").strip()

    mt_query = MeasurementType.query
    if query:
        like = f"%{query}%"
        mt_query = mt_query.filter(
            or_(
                MeasurementType.name.ilike(like),
                MeasurementType.unit.ilike(like),
            )
        )

    types = mt_query.order_by(MeasurementType.name.asc()).all()

    return jsonify(
        [
            {
                "id": item.id,
                "name": item.name,
                "unit": item.unit,
            }
            for item in types
        ]
    )


@registry_bp.route("/measurement-types", methods=["POST"])
@jwt_required()
def create_measurement_type():
    payload = request.get_json(silent=True) or {}
    name = _normalize_text(payload.get("name", ""))
    unit = _normalize_text(payload.get("unit", ""))

    if not name or not unit:
        return jsonify({"error": "Name and unit are required."}), 400

    if MeasurementType.query.filter_by(name=name).first():
        return jsonify({"error": "Measurement type already exists."}), 409

    measurement_type = MeasurementType(name=name, unit=unit)
    db.session.add(measurement_type)
    db.session.commit()

    return (
        jsonify(
            {
                "id": measurement_type.id,
                "name": measurement_type.name,
                "unit": measurement_type.unit,
            }
        ),
        201,
    )


@registry_bp.route("/diagnosis-codes", methods=["GET"])
@jwt_required()
def list_diagnosis_codes():
    query = request.args.get("q", "").strip()

    dc_query = DiagnosisCode.query
    if query:
        like = f"%{query}%"
        dc_query = dc_query.filter(
            or_(
                DiagnosisCode.code.ilike(like),
                DiagnosisCode.system.ilike(like),
                DiagnosisCode.description.ilike(like),
            )
        )

    codes = dc_query.order_by(DiagnosisCode.code.asc()).all()

    return jsonify(
        [
            {
                "id": item.id,
                "code": item.code,
                "system": item.system,
                "description": item.description,
            }
            for item in codes
        ]
    )


@registry_bp.route("/diagnosis-codes", methods=["POST"])
@jwt_required()
def create_diagnosis_code():
    payload = request.get_json(silent=True) or {}
    code = _normalize_text(payload.get("code", ""))
    system = _normalize_text(payload.get("system", ""))
    description = _normalize_text(payload.get("description", ""))

    if not code or not system:
        return jsonify({"error": "Code and system are required."}), 400

    if DiagnosisCode.query.filter_by(code=code).first():
        return jsonify({"error": "Diagnosis code already exists."}), 409

    diagnosis_code = DiagnosisCode(
        code=code,
        system=system,
        description=description if description else None,
    )
    db.session.add(diagnosis_code)
    db.session.commit()

    return (
        jsonify(
            {
                "id": diagnosis_code.id,
                "code": diagnosis_code.code,
                "system": diagnosis_code.system,
                "description": diagnosis_code.description,
            }
        ),
        201,
    )
