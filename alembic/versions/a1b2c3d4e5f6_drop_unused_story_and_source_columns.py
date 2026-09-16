"""drop unused story and source columns

Revision ID: a1b2c3d4e5f6
Revises: 92bc25c70312
Create Date: 2026-09-16 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "92bc25c70312"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("image_url")
        batch_op.drop_column("event_at")

    with op.batch_alter_table("sources") as batch_op:
        batch_op.drop_column("published_at")
        batch_op.drop_column("fetched_at")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("sources") as batch_op:
        batch_op.add_column(
            sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True)
        )

    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(
            sa.Column("event_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(sa.Column("image_url", sa.Text(), nullable=True))
