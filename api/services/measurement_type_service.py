from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import ValidationError

from models import MeasurementTypeCatalog
from repositories.measurement_type_repository import MeasurementTypeRepository
from schemas.measurement_type_schema import MeasurementTypeSchema, MeasurementTypeSyncPayload

logger = logging.getLogger(__name__)

DEFAULT_MEASUREMENT_TYPES: list[dict[str, Any]] = [
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


class MeasurementTypeService:
    def __init__(self, repo: MeasurementTypeRepository) -> None:
        self._repo = repo

    def _seed_catalog_defaults(self) -> None:
        existing_ids = self._repo.list_catalog_ids()
        inserted = False

        for item in DEFAULT_MEASUREMENT_TYPES:
            if item["id"] in existing_ids:
                continue

            self._repo.add_catalog_row(
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
            self._repo.commit()

    def _catalog_defaults(self) -> list[dict[str, Any]]:
        self._seed_catalog_defaults()

        rows = self._repo.list_catalog_rows()
        rows_by_id = {row.id: row for row in rows}
        catalog_defaults: list[dict] = []

        for default_item in DEFAULT_MEASUREMENT_TYPES:
            row = rows_by_id.get(default_item["id"])
            if row:
                catalog_defaults.append(
                    row.to_payload(default_item.get("severities", []))
                )

        return catalog_defaults

    def merged_types_for_user(self, user_id: int) -> list[dict[str, Any]]:
        catalog_defaults = self._catalog_defaults()
        catalog_defaults_by_id = {item["id"]: item for item in catalog_defaults}
        catalog_default_ids = set(catalog_defaults_by_id)

        overrides: dict[str, dict] = {}
        for row in self._repo.list_overrides_for_user(user_id):
            parsed = _load_json_payload(row.payload_json)
            if parsed and row.default_type_id in catalog_default_ids:
                overrides[row.default_type_id] = parsed

        custom: list[dict] = []
        for row in self._repo.list_custom_for_user(user_id):
            parsed = _load_json_payload(row.payload_json)
            if parsed:
                custom.append(parsed)

        merged_defaults = [
            overrides.get(default_id, catalog_defaults_by_id[default_id])
            for default_id in catalog_defaults_by_id
        ]
        return [*merged_defaults, *custom]

    def sync_types(
        self, user_id: int, payload: dict[str, Any]
    ) -> tuple[list[dict[str, Any]] | None, str | None]:
        try:
            data = MeasurementTypeSyncPayload(**payload)
        except ValidationError as err:
            return None, err.errors()

        parsed_types = [item.model_dump() for item in data.types]
        self._repo.delete_overrides_for_user(user_id)
        self._repo.delete_custom_for_user(user_id)
        catalog_defaults_by_id = {item["id"]: item for item in self._catalog_defaults()}

        for item in parsed_types:
            item_id = item["id"]
            if item_id in catalog_defaults_by_id:
                if item != catalog_defaults_by_id[item_id]:
                    self._repo.add_override(
                        user_id,
                        item_id,
                        _to_json_payload(item),
                    )
                continue

            self._repo.add_custom(
                f"{user_id}:{item_id}",
                user_id,
                _to_json_payload(item),
            )

        self._repo.commit()
        logger.info(
            "measurement_types_sync_success user_id=%s count=%s",
            user_id,
            len(parsed_types),
        )
        return self.merged_types_for_user(user_id), None

    def get_active_type_id(self, user_id: int) -> str | None:
        row = self._repo.get_preference(user_id)
        return row.active_type_id if row else None

    def set_active_type_id(
        self, user_id: int, active_type_id: str | None
    ) -> tuple[str | None, str | None]:
        if active_type_id is not None and active_type_id.strip() == "":
            active_type_id = None

        if active_type_id is not None:
            all_ids = {item["id"] for item in self.merged_types_for_user(user_id)}
            if active_type_id not in all_ids:
                return None, "activeTypeId does not exist for this user"

        self._repo.set_active_type(user_id, active_type_id)
        self._repo.commit()
        logger.info(
            "measurement_types_active_set user_id=%s active_type_id=%s",
            user_id,
            active_type_id,
        )
        return active_type_id, None
