"""existing schema baseline

Revision ID: 000000000000
Revises:
Create Date: 2026-09-13 05:39:30.000000

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "000000000000"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""


def downgrade() -> None:
    """Downgrade schema."""
