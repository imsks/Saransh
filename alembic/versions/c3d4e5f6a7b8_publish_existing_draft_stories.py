"""publish existing draft stories

Ingest now stores every Story as published, so the Drafts left behind by the
old lifecycle would stay invisible to readers forever. This promotes them.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-25 09:10:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("UPDATE stories SET status = 'published' WHERE status = 'draft'")


def downgrade() -> None:
    """Downgrade schema."""
    # Irreversible: which rows were Drafts before the upgrade is not recorded.
