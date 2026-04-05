from __future__ import annotations

import base64
import re
from datetime import datetime
from typing import Any, cast


def as_dict(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, Any] = {}
    raw_dict = cast(dict[Any, Any], value)
    for key, item in raw_dict.items():
        if isinstance(key, str):
            normalized[key] = item
    return normalized


def as_list_of_dict(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []

    normalized: list[dict[str, Any]] = []
    raw_list = cast(list[Any], value)
    for item in raw_list:
        if isinstance(item, dict):
            normalized.append(as_dict(item))
    return normalized


def as_nested_dict(value: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, dict[str, Any]] = {}
    raw_dict = cast(dict[Any, Any], value)
    for key, item in raw_dict.items():
        if isinstance(key, str) and isinstance(item, dict):
            normalized[key] = as_dict(item)
    return normalized


def as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def sanitize_file_name(value: str | None) -> str:
    raw = (value or "").strip()
    raw = re.sub(r"\.[a-zA-Z0-9]+$", "", raw)
    raw = re.sub(r"[^a-zA-Z0-9-_]+", "_", raw)
    return raw.strip("_")


def build_report_file_name(image_name: str | None, extension: str) -> str:
    safe = sanitize_file_name(image_name)
    fallback = f"relatorio_medicoes_{datetime.now().strftime('%Y%m%d_%H%M')}"
    return f"{safe or fallback}.{extension}"


def format_datetime(value: datetime, locale: str = "pt") -> str:
    if locale == "pt":
        return value.strftime("%d/%m/%Y as %H:%M")
    return value.strftime("%Y-%m-%d %H:%M")


def parse_datetime(raw: Any) -> datetime:
    if isinstance(raw, datetime):
        return raw
    if not isinstance(raw, str) or not raw.strip():
        return datetime.now()
    normalized = raw.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.now()


def find_type(measurement_type_id: str, types: list[dict[str, Any]]) -> dict[str, Any] | None:
    for item in types:
        if item.get("id") == measurement_type_id:
            return item
    return None


def is_cobb(measurement: dict[str, Any]) -> bool:
    return (
        isinstance(measurement.get("upperLine"), dict)
        and isinstance(measurement.get("lowerLine"), dict)
        and isinstance(measurement.get("angle"), (int, float))
    )


def is_distance(measurement: dict[str, Any]) -> bool:
    return isinstance(measurement.get("line"), dict) and isinstance(
        measurement.get("distance"), (int, float)
    )


def measurement_value_text(
    measurement: dict[str, Any],
    measurement_type: dict[str, Any] | None,
    distance_calibration: dict[str, Any] | None,
) -> str:
    if is_cobb(measurement):
        unit = (measurement_type or {}).get("unitMeasure") or "graus"
        angle = float(measurement.get("angle", 0.0))
        return f"{angle:.1f} {unit}"

    if is_distance(measurement):
        distance = float(measurement.get("distance", 0.0))
        if distance_calibration and isinstance(
            distance_calibration.get("pixelsPerUnit"), (int, float)
        ):
            pixels_per_unit = float(distance_calibration["pixelsPerUnit"])
            if pixels_per_unit > 0:
                distance = distance / pixels_per_unit
        unit = (distance_calibration or {}).get("unit") or "px"
        return f"{distance:.1f} {unit}"

    return "-"


def find_severity(value: float, severities: list[dict[str, Any]]) -> str | None:
    for severity in severities:
        min_value = severity.get("min")
        max_value = severity.get("max")
        if isinstance(min_value, (int, float)) and isinstance(max_value, (int, float)):
            if float(min_value) <= value <= float(max_value):
                label = severity.get("label")
                if isinstance(label, str) and label.strip():
                    return label
    return None


def decode_data_url_image(data_url: str) -> bytes | None:
    match = re.match(r"^data:image/[a-zA-Z0-9+.-]+;base64,(.*)$", data_url)
    if not match:
        return None
    try:
        return base64.b64decode(match.group(1), validate=True)
    except Exception:
        return None
