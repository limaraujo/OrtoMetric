import logging
from typing import Any, cast

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required # type: ignore

from routes.deps import get_measurement_type_service


logger = logging.getLogger(__name__)
measurement_types_bp = Blueprint("measurement_types", __name__)


def _json_payload() -> dict[str, Any]:
    raw = request.get_json(silent=True)
    return cast(dict[str, Any], raw) if isinstance(raw, dict) else {}


@measurement_types_bp.route("", methods=["GET"])
@jwt_required()
def list_measurement_types():
    # Requer JWT valido e usa o usuario do token para escopo dos dados.
    user_id = int(get_jwt_identity())
    logger.info("measurement_types_list user_id=%s", user_id)
    # Servico combina catalogo base + customizacoes do usuario.
    svc = get_measurement_type_service()
    return jsonify(svc.merged_types_for_user(user_id)), 200


@measurement_types_bp.route("/sync", methods=["PUT"])
@jwt_required()
def sync_measurement_types():
    # Sincroniza alteracoes do frontend (ativacao, severidades, ordem etc.)
    # para a configuracao do usuario autenticado.
    user_id = int(get_jwt_identity())
    payload = _json_payload()

    svc = get_measurement_type_service()
    # Retorna lista mesclada atualizada e possiveis erros de dominio.
    merged, errors = svc.sync_types(user_id, payload)
    if errors is not None:
        return jsonify({"error": errors}), 400

    return jsonify(merged), 200


@measurement_types_bp.route("/active", methods=["GET"])
@jwt_required()
def get_active_measurement_type():
    # Le o tipo ativo atual para inicializar estado do workspace do medico.
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
    # Permite definir ou limpar (null) o tipo ativo.
    # Valor vem do corpo para refletir selecao explicita da UI.
    user_id = int(get_jwt_identity())
    payload = _json_payload()
    active_type_id = payload.get("activeTypeId")

    # Validacao leve de contrato antes de chamar regra de negocio.
    if active_type_id is not None and not isinstance(active_type_id, str):
        return jsonify({"error": "activeTypeId must be a string or null"}), 400

    svc = get_measurement_type_service()
    # Servico valida existencia/permissao e devolve valor persistido.
    resolved, err = svc.set_active_type_id(user_id, active_type_id)
    if err:
        return jsonify({"error": err}), 400

    return jsonify({"activeTypeId": resolved}), 200
