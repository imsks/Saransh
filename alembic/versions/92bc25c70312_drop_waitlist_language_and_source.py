"""drop waitlist language and source

Revision ID: 92bc25c70312
Revises: 000000000000
Create Date: 2026-09-13 05:36:51.831050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92bc25c70312'
down_revision: Union[str, Sequence[str], None] = "000000000000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.drop_column("language")
        batch_op.drop_column("source")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.add_column(sa.Column("language", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("source", sa.Text(), nullable=True))
