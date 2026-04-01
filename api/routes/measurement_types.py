import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from pydantic import ValidationError

from routes.deps import get_measurement_type_service


logger = logging.getLogger(__name__)
measurement_types_bp = Blueprint("measurement_types", __name__)


def _validation_error_response(err: ValidationError):
    return jsonify({"error": err.errors()}), 400


@measurement_types_bp.route("", methods=["GET"])
@jwt_required()
def list_measurement_types():
    user_id = int(get_jwt_identity())
    logger.info("measurement_types_list user_id=%s", user_id)
    svc = get_measurement_type_service()
    return jsonify(svc.merged_types_for_user(user_id)), 200


@measurement_types_bp.route("/sync", methods=["PUT"])
@jwt_required()
def sync_measurement_types():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}

    svc = get_measurement_type_service()
    merged, errors = svc.sync_types(user_id, payload)
    if errors is not None:
        return jsonify({"error": errors}), 400

    return jsonify(merged), 200


@measurement_types_bp.route("/active", methods=["GET"])
@jwt_required()
def get_active_measurement_type():
    user_id = int(get_jwt_identity())
    svc = get_measurement_type_service()
    active_type_id = svc.get_active_type_id(user_id)
    logger.info(
        "measurement_types_active_get user_id=%s active_type_id=%s",
        user_id,
        active_type_id,
    )
    return jsonify({"activeTypeId": active_type_id}), 200


@measurement_types_bp.route("/active", methods=["PUT"])
@jwt_required()
def set_active_measurement_type():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    active_type_id = payload.get("activeTypeId")

    if active_type_id is not None and not isinstance(active_type_id, str):
        return jsonify({"error": "activeTypeId must be a string or null"}), 400

    svc = get_measurement_type_service()
    resolved, err = svc.set_active_type_id(user_id, active_type_id)
    if err:
        return jsonify({"error": err}), 400

    return jsonify({"activeTypeId": resolved}), 200
