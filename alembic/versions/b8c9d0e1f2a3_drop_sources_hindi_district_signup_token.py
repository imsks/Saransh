"""drop sources, hindi text, district and waitlist signup token; add source label

Saransh is English-only and a Story carries one Citation Link with a label
instead of a list of Sources. The downgrade restores the shape, not the data.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-18 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table("sources")

    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("title_hi")
        batch_op.drop_column("summary_hi")
        batch_op.drop_column("district")
        batch_op.add_column(sa.Column("source_label", sa.Text(), nullable=True))

    # Dropping the column drops its unique constraint, whichever name it got
    # (migrated databases: uq_waitlist_signup_token; create_all: waitlist_signup_token_key).
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.drop_column("signup_token")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.add_column(
            sa.Column("signup_token", postgresql.UUID(as_uuid=False), nullable=True)
        )
        batch_op.create_unique_constraint("uq_waitlist_signup_token", ["signup_token"])

    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("source_label")
        batch_op.add_column(sa.Column("district", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("summary_hi", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("title_hi", sa.Text(), nullable=True))

    op.create_table(
        "sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "story_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("stories.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("outlet", sa.String(150), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("source_type", sa.String(30), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("story_id", "url", name="uq_story_source_url"),
    )
