"""add story tier

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-11-13 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(sa.Column("tier", sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("tier")
