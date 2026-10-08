"""drop story published_at

A Story is published the moment it is ingested (the Draft step was removed on
2026-09-25), so `published_at` only ever duplicated `created_at` or sat null.
`created_at` is now the single time of record and the column goes away.

Downgrade re-adds it as nullable and backfills it from `created_at` for rows
that are published, which is the value the column would have held.

Revision ID: f6a7b8c9d0e1
Revises: e4f5a6b7c8d9
Create Date: 2026-10-01 08:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("published_at")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True)
        )

    op.execute(
        "UPDATE stories SET published_at = created_at WHERE status = 'published'"
    )
