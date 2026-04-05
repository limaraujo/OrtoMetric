from __future__ import annotations

from typing import Any, cast

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import jwt_required  # type: ignore
from pydantic import ValidationError

from schemas.report_schema import ReportPayloadSchema, report_payload_to_dict
from services.report_service import (
    build_pdf_report,
    build_report_file_name,
    build_txt_report,
)


reports_bp = Blueprint("reports", __name__)


def _json_payload() -> dict[str, Any]:
    raw = request.get_json(silent=True)
    return cast(dict[str, Any], raw) if isinstance(raw, dict) else {}


def _validated_payload() -> tuple[dict[str, Any] | None, tuple[Response, int] | None]:
    payload = _json_payload()
    try:
        validated = ReportPayloadSchema(**payload)
    except ValidationError as err:
        return None, (jsonify({"error": err.errors()}), 400)
    return report_payload_to_dict(validated), None


@reports_bp.route("/txt", methods=["POST"])
@jwt_required()
def export_txt_report():
    payload, error_response = _validated_payload()
    if error_response is not None:
        return error_response

    assert payload is not None
    content = build_txt_report(payload)
    file_name = build_report_file_name(payload.get("imageName"), "txt")

    return Response(
        content,
        mimetype="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


@reports_bp.route("/pdf", methods=["POST"])
@jwt_required()
def export_pdf_report():
    payload, error_response = _validated_payload()
    if error_response is not None:
        return error_response

    assert payload is not None
    content = build_pdf_report(payload)
    file_name = build_report_file_name(payload.get("imageName"), "pdf")

    return Response(
        content,
        mimetype="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )

