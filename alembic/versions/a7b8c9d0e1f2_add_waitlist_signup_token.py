"""add waitlist signup token

Gives every Waitlist Signup an opaque public identifier, so the autoincrementing
primary key never leaves the database. Existing rows are backfilled with one
fresh UUID each before the column is made required and unique.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-10-05 01:40:00.000000

"""

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.add_column(
            sa.Column("signup_token", postgresql.UUID(as_uuid=False), nullable=True)
        )

    # Backfill row by row: every Signup needs its own Token, so a single
    # server-side default value would not do.
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id FROM waitlist")).fetchall()
    for (row_id,) in rows:
        connection.execute(
            sa.text("UPDATE waitlist SET signup_token = :token WHERE id = :id"),
            {"token": str(uuid.uuid4()), "id": row_id},
        )

    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.alter_column(
            "signup_token",
            existing_type=postgresql.UUID(as_uuid=False),
            nullable=False,
        )
        batch_op.create_unique_constraint("uq_waitlist_signup_token", ["signup_token"])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.drop_constraint("uq_waitlist_signup_token", type_="unique")
        batch_op.drop_column("signup_token")
