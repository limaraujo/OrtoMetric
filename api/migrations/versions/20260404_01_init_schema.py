"""initial schema

Revision ID: 20260404_01
Revises: 
Create Date: 2026-04-04 00:00:00.000000

"""
from __future__ import annotations

from typing import Any, cast

from alembic import op as alembic_op  # type: ignore
import sqlalchemy as sa

op = cast(Any, alembic_op)


# revision identifiers, used by Alembic.
revision = "20260404_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "measurement_type_catalog",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("base_type", sa.String(length=20), nullable=False),
        sa.Column("cid", sa.String(length=20), nullable=False),
        sa.Column("unit", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at_label", sa.String(length=40), nullable=False),
        sa.Column("severities_json", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )

    op.create_table(
        "measurement_type_custom",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_measurement_type_custom_user_id",
        "measurement_type_custom",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "measurement_type_override",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("default_type_id", sa.String(length=120), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "default_type_id", name="uq_mto_user_default"),
    )
    op.create_index(
        "ix_measurement_type_override_user_id",
        "measurement_type_override",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "measurement_type_preference",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("active_type_id", sa.String(length=120), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        "ix_measurement_type_preference_user_id",
        "measurement_type_preference",
        ["user_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_measurement_type_preference_user_id", table_name="measurement_type_preference")
    op.drop_table("measurement_type_preference")

    op.drop_index("ix_measurement_type_override_user_id", table_name="measurement_type_override")
    op.drop_table("measurement_type_override")

    op.drop_index("ix_measurement_type_custom_user_id", table_name="measurement_type_custom")
    op.drop_table("measurement_type_custom")

    op.drop_table("user")
    op.drop_table("measurement_type_catalog")
