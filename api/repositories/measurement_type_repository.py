from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy

from extensions.db import db
from models import MeasurementTypeCatalog
from models.measurement_type_config import MeasurementTypeCustom, MeasurementTypeOverride, MeasurementTypePreference


class MeasurementTypeRepository:
    def __init__(self, db_ext: SQLAlchemy | None = None) -> None:
        self._db = db_ext or db

    @property
    def session(self):
        return self._db.session

    def list_catalog_ids(self) -> set[str]:
        return {row.id for row in MeasurementTypeCatalog.query.all()}

    def add_catalog_row(self, row: MeasurementTypeCatalog) -> None:
        self.session.add(row)

    def list_catalog_rows(self) -> list[MeasurementTypeCatalog]:
        return list(MeasurementTypeCatalog.query.all())

    def list_overrides_for_user(self, user_id: int) -> list[MeasurementTypeOverride]:
        return MeasurementTypeOverride.query.filter_by(user_id=user_id).all()

    def list_custom_for_user(self, user_id: int) -> list[MeasurementTypeCustom]:
        return MeasurementTypeCustom.query.filter_by(user_id=user_id).all()

    def delete_overrides_for_user(self, user_id: int) -> None:
        MeasurementTypeOverride.query.filter_by(user_id=user_id).delete()

    def delete_custom_for_user(self, user_id: int) -> None:
        MeasurementTypeCustom.query.filter_by(user_id=user_id).delete()

    def add_override(
        self, user_id: int, default_type_id: str, payload_json: str
    ) -> None:
        self.session.add(
            MeasurementTypeOverride(
                user_id=user_id,
                default_type_id=default_type_id,
                payload_json=payload_json,
            )
        )

    def add_custom(self, row_id: str, user_id: int, payload_json: str) -> None:
        self.session.add(
            MeasurementTypeCustom(
                id=row_id,
                user_id=user_id,
                payload_json=payload_json,
            )
        )

    def get_preference(self, user_id: int) -> MeasurementTypePreference | None:
        return MeasurementTypePreference.query.filter_by(user_id=user_id).first()

    def set_active_type(self, user_id: int, active_type_id: str | None) -> None:
        row = self.get_preference(user_id)
        if not row:
            self.session.add(
                MeasurementTypePreference(user_id=user_id, active_type_id=active_type_id)
            )
        else:
            row.active_type_id = active_type_id

    def commit(self) -> None:
        self.session.commit()
