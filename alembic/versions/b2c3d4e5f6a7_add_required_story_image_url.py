"""add required story image_url

Re-adds the Story cover photo dropped in a1b2c3d4e5f6, this time as a required
(NOT NULL) column. Existing rows are backfilled with an empty string via a
temporary server default, which is then removed so the application must supply
the value on every ingest.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-23 04:35:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(
            sa.Column(
                "image_url",
                sa.Text(),
                nullable=False,
                server_default="",
            )
        )
    # Drop the temporary default so future inserts must provide a cover photo.
    with op.batch_alter_table("stories") as batch_op:
        batch_op.alter_column("image_url", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("image_url")
