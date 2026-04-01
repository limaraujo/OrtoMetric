import json
import logging
from typing import Any

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from pydantic import ValidationError

from extensions.db import db
from models import MeasurementTypeCatalog
from models.measurement_type_config import MeasurementTypeCustom, MeasurementTypeOverride, MeasurementTypePreference
from schemas.measurement_type_schema import MeasurementTypeSchema, MeasurementTypeSyncPayload


logger = logging.getLogger(__name__)
measurement_types_bp = Blueprint("measurement_types", __name__)

DEFAULT_MEASUREMENT_TYPES = [
    {
        "id": "default-cobb-angle",
        "name": "Ângulo de Cobb",
        "baseType": "angulo",
        "cid": "",
        "unit": "graus",
        "desc": "Medição padrão para escoliose vertebral.",
        "createdAt": "predefinido",
        "severities": [
            {"id": "s1", "label": "Normal", "min": 0, "max": 10, "color": "#1D9E75"},
            {"id": "s2", "label": "Leve", "min": 10, "max": 25, "color": "#BA7517"},
            {"id": "s3", "label": "Moderado", "min": 25, "max": 40, "color": "#D85A30"},
            {"id": "s4", "label": "Grave", "min": 40, "max": 999, "color": "#E24B4A"},
        ],
    },
    {
        "id": "default-interpedicular-distance",
        "name": "Distância interpedicular",
        "baseType": "distancia",
        "cid": "",
        "unit": "mm",
        "desc": "Distância entre os pedículos vertebrais.",
        "createdAt": "predefinido",
        "severities": [],
    },
]

DEFAULTS_BY_ID = {item["id"]: item for item in DEFAULT_MEASUREMENT_TYPES}
DEFAULT_IDS = set(DEFAULTS_BY_ID)


def _validation_error_response(err: ValidationError):
    return jsonify({"error": err.errors()}), 400


def _to_json_payload(item: dict[str, Any]) -> str:
    return json.dumps(item, ensure_ascii=False)


def _load_json_payload(raw: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            return None
        MeasurementTypeSchema(**parsed)
        return parsed
    except Exception:
        return None


def _seed_catalog_defaults() -> None:
    existing_ids = {row.id for row in MeasurementTypeCatalog.query.all()}
    inserted = False

    for item in DEFAULT_MEASUREMENT_TYPES:
        if item["id"] in existing_ids:
            continue

        db.session.add(
            MeasurementTypeCatalog(
                id=item["id"],
                name=item["name"],
                base_type=item["baseType"],
                cid=item.get("cid", ""),
                unit=item.get("unit", ""),
                description=item.get("desc", ""),
                created_at_label=item.get("createdAt", "predefinido"),
                severities_json=_to_json_payload(item.get("severities", [])),
            )
        )
        inserted = True

    if inserted:
        db.session.commit()


def _catalog_defaults() -> list[dict[str, Any]]:
    _seed_catalog_defaults()

    rows = MeasurementTypeCatalog.query.all()
    rows_by_id = {row.id: row for row in rows}
    catalog_defaults: list[dict] = []

    for default_item in DEFAULT_MEASUREMENT_TYPES:
        row = rows_by_id.get(default_item["id"])
        if row:
                        catalog_defaults.append(row.to_payload(default_item.get("severities", [])))

    return catalog_defaults


def _merged_types_for_user(user_id: int) -> list[dict[str, Any]]:
    catalog_defaults = _catalog_defaults()
    catalog_defaults_by_id = {item["id"]: item for item in catalog_defaults}
    catalog_default_ids = set(catalog_defaults_by_id)

    overrides_rows = MeasurementTypeOverride.query.filter_by(user_id=user_id).all()
    overrides: dict[str, dict] = {}

    for row in overrides_rows:
        parsed = _load_json_payload(row.payload_json)
        if parsed and row.default_type_id in catalog_default_ids:
            overrides[row.default_type_id] = parsed

    custom_rows = MeasurementTypeCustom.query.filter_by(user_id=user_id).all()
    custom: list[dict] = []
    for row in custom_rows:
        parsed = _load_json_payload(row.payload_json)
        if parsed:
            custom.append(parsed)

    merged_defaults = [overrides.get(default_id, catalog_defaults_by_id[default_id]) for default_id in catalog_defaults_by_id]
    return [*merged_defaults, *custom]


@measurement_types_bp.route("", methods=["GET"])
@jwt_required()
def list_measurement_types():
    user_id = int(get_jwt_identity())
    logger.info("measurement_types_list user_id=%s", user_id)
    return jsonify(_merged_types_for_user(user_id)), 200


@measurement_types_bp.route("/sync", methods=["PUT"])
@jwt_required()
def sync_measurement_types():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}

    try:
        data = MeasurementTypeSyncPayload(**payload)
    except ValidationError as err:
        return _validation_error_response(err)

    parsed_types = [item.model_dump() for item in data.types]
    MeasurementTypeOverride.query.filter_by(user_id=user_id).delete()
    MeasurementTypeCustom.query.filter_by(user_id=user_id).delete()
    catalog_defaults_by_id = {item["id"]: item for item in _catalog_defaults()}

    for item in parsed_types:
        item_id = item["id"]
        if item_id in catalog_defaults_by_id:
            if item != catalog_defaults_by_id[item_id]:
                db.session.add(
                    MeasurementTypeOverride(
                        user_id=user_id,
                        default_type_id=item_id,
                        payload_json=_to_json_payload(item),
                    )
                )
            continue

        db.session.add(
            MeasurementTypeCustom(
                id=f"{user_id}:{item_id}",
                user_id=user_id,
                payload_json=_to_json_payload(item),
            )
        )

    # Defaults omitted by the client are restored to canonical defaults by design.
    db.session.commit()
    logger.info("measurement_types_sync_success user_id=%s count=%s", user_id, len(parsed_types))

    return jsonify(_merged_types_for_user(user_id)), 200


@measurement_types_bp.route("/active", methods=["GET"])
@jwt_required()
def get_active_measurement_type():
    user_id = int(get_jwt_identity())
    row = MeasurementTypePreference.query.filter_by(user_id=user_id).first()
    active_type_id = row.active_type_id if row else None
    logger.info("measurement_types_active_get user_id=%s active_type_id=%s", user_id, active_type_id)
    return jsonify({"activeTypeId": active_type_id}), 200


@measurement_types_bp.route("/active", methods=["PUT"])
@jwt_required()
def set_active_measurement_type():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    active_type_id = payload.get("activeTypeId")

    if active_type_id is not None and not isinstance(active_type_id, str):
        return jsonify({"error": "activeTypeId must be a string or null"}), 400

    if isinstance(active_type_id, str) and active_type_id.strip() == "":
        active_type_id = None

    if active_type_id is not None:
        all_ids = {item["id"] for item in _merged_types_for_user(user_id)}
        if active_type_id not in all_ids:
            return jsonify({"error": "activeTypeId does not exist for this user"}), 400

    row = MeasurementTypePreference.query.filter_by(user_id=user_id).first()
    if not row:
        row = MeasurementTypePreference(user_id=user_id, active_type_id=active_type_id)
        db.session.add(row)
    else:
        row.active_type_id = active_type_id

    db.session.commit()
    logger.info("measurement_types_active_set user_id=%s active_type_id=%s", user_id, active_type_id)
    return jsonify({"activeTypeId": active_type_id}), 200
