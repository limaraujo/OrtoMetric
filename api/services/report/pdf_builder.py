from __future__ import annotations

from datetime import datetime
from io import BytesIO
from textwrap import wrap
from typing import Any

from services.report.helpers import (
    as_dict,
    as_list_of_dict,
    as_nested_dict,
    as_text,
    decode_data_url_image,
    find_severity,
    find_type,
    format_datetime,
    is_cobb,
    measurement_value_text,
    parse_datetime,
)


class _PdfWriter:
    """
    Wrapper sobre reportlab Canvas.
    Paleta estritamente preto e branco - sem cores.
    """

    MARGIN_X = 48
    BOTTOM_LIMIT = 60
    LINE_H = 14
    FIELD_LABEL_W = 130

    BLACK = (0.00, 0.00, 0.00)
    DARK = (0.15, 0.15, 0.15)
    MID = (0.40, 0.40, 0.40)
    LIGHT = (0.65, 0.65, 0.65)
    PALE = (0.92, 0.92, 0.92)

    def __init__(self, buffer: BytesIO, title: str, author: str):
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas as rl_canvas

        self.page_width, self.page_height = A4
        self.pdf = rl_canvas.Canvas(buffer, pagesize=A4)
        self.y = self.page_height - 52
        self._page_num = 1
        self._report_title = title

        self.pdf.setTitle(title)
        if author:
            self.pdf.setAuthor(author)

        self._draw_page_header()

    def ensure_space(self, height: float) -> None:
        if self.y - height >= self.BOTTOM_LIMIT:
            return
        self._draw_page_footer()
        self.pdf.showPage()
        self._page_num += 1
        self.pdf.setFont("Helvetica", 9)
        self.y = self.page_height - 52
        self._draw_page_header()

    def save(self) -> None:
        self._draw_page_footer()
        self.pdf.save()

    def _draw_page_header(self) -> None:
        self._set(self.DARK)
        self.pdf.setFont("Helvetica-Bold", 10)
        self.pdf.drawString(self.MARGIN_X, self.page_height - 34, "ORTOMETRIC")
        self._set(self.MID)
        self.pdf.setFont("Helvetica", 9)
        self.pdf.drawString(
            self.MARGIN_X + 74, self.page_height - 34, "Sistema de Medicoes Radiologicas"
        )
        self._set(self.LIGHT)
        self.pdf.setLineWidth(0.5)
        self.pdf.line(
            self.MARGIN_X,
            self.page_height - 40,
            self.page_width - self.MARGIN_X,
            self.page_height - 40,
        )
        self._set(self.BLACK)

    def _draw_page_footer(self) -> None:
        self._set(self.LIGHT)
        self.pdf.setLineWidth(0.4)
        self.pdf.line(
            self.MARGIN_X,
            self.BOTTOM_LIMIT - 4,
            self.page_width - self.MARGIN_X,
            self.BOTTOM_LIMIT - 4,
        )
        self._set(self.MID)
        self.pdf.setFont("Helvetica", 7)
        self.pdf.drawString(self.MARGIN_X, self.BOTTOM_LIMIT - 16, self._report_title)
        self.pdf.drawRightString(
            self.page_width - self.MARGIN_X,
            self.BOTTOM_LIMIT - 16,
            f"Pagina {self._page_num}",
        )
        self._set(self.BLACK)

    def _set(self, rgb: tuple[float, float, float]) -> None:
        self.pdf.setFillColorRGB(*rgb)

    def _stroke(self, rgb: tuple[float, float, float]) -> None:
        self.pdf.setStrokeColorRGB(*rgb)

    def draw_title(self, text: str) -> None:
        self.ensure_space(26)
        self._set(self.DARK)
        self.pdf.setFont("Helvetica-Bold", 15)
        self.pdf.drawString(self.MARGIN_X, self.y, text)
        self.y -= 20
        self._set(self.BLACK)

    def draw_section_heading(self, text: str) -> None:
        self.ensure_space(26)
        self.y -= 6
        self._set(self.DARK)
        self.pdf.setFont("Helvetica-Bold", 10)
        self.pdf.drawString(self.MARGIN_X, self.y, text.upper())
        self.y -= 3
        self._set(self.LIGHT)
        self.pdf.setLineWidth(0.6)
        self.pdf.line(self.MARGIN_X, self.y, self.page_width - self.MARGIN_X, self.y)
        self.y -= 10
        self._set(self.BLACK)

    def draw_field(self, label: str, value: str, indent: int = 0) -> None:
        x = self.MARGIN_X + indent
        value_x = x + self.FIELD_LABEL_W
        available_w = self.page_width - self.MARGIN_X - value_x
        chars_per_line = max(20, int(available_w / 5.5))
        value_lines = wrap(value, chars_per_line) if value else ["--"]

        for i, vline in enumerate(value_lines):
            self.ensure_space(self.LINE_H)
            if i == 0:
                self._set(self.MID)
                self.pdf.setFont("Helvetica-Bold", 9)
                self.pdf.drawString(x, self.y, label)
            self._set(self.BLACK)
            self.pdf.setFont("Helvetica", 9)
            self.pdf.drawString(value_x, self.y, vline)
            self.y -= self.LINE_H

    def draw_body_text(self, text: str, indent: int = 0) -> None:
        self.pdf.setFont("Helvetica", 9)
        self._set(self.BLACK)
        for line in wrap(text, 90) or [""]:
            self.ensure_space(self.LINE_H)
            self.pdf.drawString(self.MARGIN_X + indent, self.y, line)
            self.y -= self.LINE_H

    def draw_spacer(self, h: float = 8.0) -> None:
        self.y -= h

    def draw_thin_rule(self) -> None:
        self.ensure_space(8)
        self._set(self.LIGHT)
        self.pdf.setLineWidth(0.3)
        self.pdf.line(self.MARGIN_X, self.y, self.page_width - self.MARGIN_X, self.y)
        self.y -= 8
        self._set(self.BLACK)

    def draw_conclusions_block(self, text: str) -> None:
        lines_wrapped = wrap(text, 88) or [text]
        for line in lines_wrapped:
            self.ensure_space(self.LINE_H)
            self._set(self.BLACK)
            self.pdf.setFont("Helvetica", 9)
            self.pdf.drawString(self.MARGIN_X, self.y, line)
            self.y -= self.LINE_H
        self.draw_spacer(4)

    def draw_measurement_block(
        self,
        idx: int,
        measurement: dict[str, Any],
        measurement_type: dict[str, Any] | None,
        distance_calibration: dict[str, Any] | None,
        selection: dict[str, Any],
        locale: str,
    ) -> None:
        type_name = (measurement_type or {}).get("name") or "Medicao"

        self.ensure_space(18)
        self._set(self.DARK)
        self.pdf.setFont("Helvetica-Bold", 10)
        self.pdf.drawString(self.MARGIN_X, self.y, f"{idx}.  {type_name}")
        self.y -= 14

        indent = 16

        if selection.get("includeValue", True):
            val = measurement_value_text(measurement, measurement_type, distance_calibration)
            self.draw_field("Valor:", val, indent=indent)

        if selection.get("includeTimestamp", True):
            ts = format_datetime(parse_datetime(measurement.get("timestamp")), locale)
            self.draw_field("Data da medicao:", ts, indent=indent)

        if selection.get("includeCid", True):
            cid = as_text((measurement_type or {}).get("cid"))
            if cid:
                self.draw_field("CID:", cid, indent=indent)

        if selection.get("includeDescription", True):
            desc = as_text((measurement_type or {}).get("desc"))
            if desc:
                self.draw_field("Descricao:", desc, indent=indent)

        if selection.get("includeSeverity", True) and is_cobb(measurement):
            angle = float(measurement.get("angle", 0.0))
            sev = find_severity(
                angle, as_list_of_dict((measurement_type or {}).get("severities"))
            )
            if sev:
                self.draw_field("Classificacao:", sev, indent=indent)

        if selection.get("includeDetails", True):
            details = as_text(selection.get("details") or measurement.get("details") or "")
            if details:
                self.draw_field("Observacoes:", details, indent=indent)

        self.draw_thin_rule()

    def draw_image(self, decoded: bytes) -> None:
        from reportlab.lib.utils import ImageReader

        try:
            reader = ImageReader(BytesIO(decoded))
            img_w, img_h = reader.getSize()
            if img_w <= 0 or img_h <= 0:
                return
            max_w = self.page_width - self.MARGIN_X * 2
            max_h = 230
            scale = min(max_w / img_w, max_h / img_h)
            tw, th = img_w * scale, img_h * scale
            self.ensure_space(th + 10)
            self.pdf.drawImage(
                reader,
                self.MARGIN_X + (max_w - tw) / 2,
                self.y - th,
                width=tw,
                height=th,
                preserveAspectRatio=True,
                mask="auto",
            )
            self.y -= th + 10
        except Exception:
            self.draw_body_text("Imagem indisponivel para renderizacao no PDF.")


def build_pdf_report(payload: dict[str, Any], locale: str = "pt") -> bytes:
    from reportlab.lib.pagesizes import A4  # noqa: F401 - valida dependencia

    measurements = as_list_of_dict(payload.get("measurements"))
    types = as_list_of_dict(payload.get("types"))
    distance_calibration = as_dict(payload.get("distanceCalibration"))
    image_data_url = payload.get("imageDataUrl")
    options = as_dict(payload.get("options"))

    title = as_text(options.get("title")) or "Relatorio de Medicoes"
    author = as_text(options.get("author"))
    conclusions = as_text(options.get("conclusions"))
    include_image = bool(options.get("includeImage", True))
    patient = as_dict(options.get("patient"))
    exam = as_dict(options.get("exam"))
    doctor = as_dict(options.get("doctor"))
    fields_by_id = as_nested_dict(options.get("fieldsByMeasurementId"))

    included = [
        m
        for m in measurements
        if fields_by_id.get(str(m.get("id") or ""), {}).get("include", True) is not False
    ]

    buffer = BytesIO()
    writer = _PdfWriter(buffer, title, author)

    writer.draw_title(title)
    writer.draw_field("Data de geracao:", format_datetime(datetime.now(), locale))
    if author:
        writer.draw_field("Responsavel:", author)
    writer.draw_spacer(6)

    patient_fields = [
        ("Nome:", as_text(patient.get("fullName"))),
        ("Nascimento:", as_text(patient.get("birthDate"))),
        ("Idade:", as_text(patient.get("age"))),
        ("Sexo:", as_text(patient.get("sex"))),
        ("Documento:", as_text(patient.get("document"))),
    ]
    if any(v for _, v in patient_fields):
        writer.draw_section_heading("Paciente")
        for label, value in patient_fields:
            if value:
                writer.draw_field(label, value)
        writer.draw_spacer()

    exam_fields = [
        ("Tipo:", as_text(exam.get("type"))),
        ("Regiao:", as_text(exam.get("region"))),
        ("Motivacao:", as_text(exam.get("motivation"))),
    ]
    if any(v for _, v in exam_fields):
        writer.draw_section_heading("Exame")
        for label, value in exam_fields:
            if value:
                writer.draw_field(label, value)
        writer.draw_spacer()

    doctor_fields = [
        ("Nome:", as_text(doctor.get("fullName"))),
        ("CRM:", as_text(doctor.get("CRM"))),
        ("Especialidade:", as_text(doctor.get("specialty"))),
    ]
    if any(v for _, v in doctor_fields):
        writer.draw_section_heading("Responsavel Tecnico")
        for label, value in doctor_fields:
            if value:
                writer.draw_field(label, value)
        writer.draw_spacer()

    if include_image and isinstance(image_data_url, str) and image_data_url:
        decoded = decode_data_url_image(image_data_url)
        if decoded:
            writer.draw_section_heading("Imagem Analisada")
            writer.draw_image(decoded)

    writer.draw_section_heading("ACHADOS RADIOGRAFICOS")
    if not included:
        writer.draw_body_text("Nenhuma medicao selecionada para este relatorio.")
    else:
        for idx, measurement in enumerate(included, start=1):
            selection = fields_by_id.get(str(measurement.get("id") or ""), {})
            mtype = find_type(str(measurement.get("measurementTypeId", "")), types)
            writer.draw_measurement_block(
                idx, measurement, mtype, distance_calibration, selection, locale
            )

    if conclusions:
        writer.draw_section_heading("Conclusoes")
        writer.draw_conclusions_block(conclusions)

    writer.save()
    return buffer.getvalue()
