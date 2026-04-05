from __future__ import annotations

from datetime import datetime
from textwrap import wrap
from typing import Any

from services.report.helpers import (
    as_dict,
    as_list_of_dict,
    as_text,
    find_severity,
    find_type,
    format_datetime,
    is_cobb,
    is_distance,
    measurement_value_text,
    parse_datetime,
)


def build_txt_report(payload: dict[str, Any], locale: str = "pt") -> str:
    measurements = as_list_of_dict(payload.get("measurements"))
    types = as_list_of_dict(payload.get("types"))
    distance_calibration = as_dict(payload.get("distanceCalibration"))
    options = as_dict(payload.get("options"))
    conclusions = as_text(options.get("conclusions"))

    lines: list[str] = [
        "RELATORIO DE MEDICOES - ORTOMETRIC",
        "=" * 40,
        "",
        f"Data de geracao: {format_datetime(datetime.now(), locale)}",
        f"Total de medicoes: {len(measurements)}",
        "",
    ]

    include_scale = bool(options.get("includeScale", True))
    pixels_per_unit = distance_calibration.get("pixelsPerUnit")
    unit = as_text(distance_calibration.get("unit"))
    if include_scale and isinstance(pixels_per_unit, (int, float)) and float(pixels_per_unit) > 0:
        lines += [
            "ESCALA ATIVA",
            "-" * 20,
            f"1 {unit or 'un'} = {float(pixels_per_unit):.3f} px",
            "",
        ]

    if conclusions:
        lines += ["CONCLUSOES", "-" * 20]
        lines += wrap(conclusions, 72) or [conclusions]
        lines += [""]

    lines += ["DETALHAMENTO DAS MEDICOES", "-" * 20]

    if not measurements:
        lines.append("Nenhuma medicao registrada.")

    for idx, measurement in enumerate(measurements, start=1):
        measurement_type = find_type(str(measurement.get("measurementTypeId", "")), types)
        measured_at = format_datetime(parse_datetime(measurement.get("timestamp")), locale)
        type_name = (measurement_type or {}).get("name") or "Medicao"

        lines += [
            "",
            f"#{idx} - {type_name}",
            f"  Valor           : {measurement_value_text(measurement, measurement_type, distance_calibration)}",
            f"  Data da medicao : {measured_at}",
        ]

        if measurement_type:
            cid = as_text(measurement_type.get("cid"))
            if cid:
                lines.append(f"  CID             : {cid}")
            desc = as_text(measurement_type.get("desc"))
            if desc:
                lines.append(f"  Descricao       : {desc}")

        if is_cobb(measurement):
            angle = float(measurement.get("angle", 0.0))
            severity = find_severity(
                angle, as_list_of_dict((measurement_type or {}).get("severities"))
            )
            if severity:
                lines.append(f"  Classificacao   : {severity}")

        if is_distance(measurement):
            raw_px = float(measurement.get("distance", 0.0))
            lines.append(f"  Distancia (px)  : {raw_px:.2f}")
            severity = find_severity(
                raw_px, as_list_of_dict((measurement_type or {}).get("severities"))
            )
            if severity:
                lines.append(f"  Classificacao   : {severity}")

        details = as_text(measurement.get("details") or "")
        if details:
            lines.append(f"  Observacoes     : {details}")

    return "\n".join(lines)
