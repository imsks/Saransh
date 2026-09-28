"""add story source_url

Adds the citation link for a Story: the canonical Article the Summary was
extracted from. Nullable and left empty on existing rows — Stories ingested
before the routine started sending it have no single canonical Article, and
their `sources` rows remain the attribution of record.

Revision ID: e4f5a6b7c8d9
Revises: 9318b51c9656
Create Date: 2026-09-28 22:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, Sequence[str], None] = "9318b51c9656"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(sa.Column("source_url", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("source_url")
