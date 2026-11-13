"""Remove the retired waitlist table.

Export any signup records that must be retained before upgrading. Downgrading
recreates the previous schema only; deleted records cannot be recovered.

Revision ID: a9b8c7d6e5f4
Revises: f1a2b3c4d5e6
Create Date: 2026-11-12 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "a9b8c7d6e5f4"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if "waitlist" in sa.inspect(op.get_bind()).get_table_names():
        op.drop_table("waitlist")


def downgrade() -> None:
    op.create_table(
        "waitlist",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "signup_token",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("(gen_random_uuid())"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("signup_token", name="uq_waitlist_signup_token"),
    )
