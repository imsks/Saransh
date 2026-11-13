"""drop legacy sources, Hindi, district and signup token

Contract step for b8c9d0e1f2a3: citations already live on stories.source_label
and waitlist inserts no longer send a token. Drops only what exists, because
databases bootstrapped from the current models never had these fields.

Revision ID: f1a2b3c4d5e6
Revises: e2f3a4b5c6d7
Create Date: 2026-11-13 09:50:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LEGACY_STORY_COLUMNS = ("title_hi", "summary_hi", "district")


def upgrade() -> None:
    """Upgrade schema."""
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())

    if "sources" in tables:
        op.drop_table("sources")

    story_columns = {c["name"] for c in inspector.get_columns("stories")}
    legacy = [name for name in LEGACY_STORY_COLUMNS if name in story_columns]
    if legacy:
        with op.batch_alter_table("stories") as batch_op:
            for name in legacy:
                batch_op.drop_column(name)

    waitlist_columns = (
        {c["name"] for c in inspector.get_columns("waitlist")}
        if "waitlist" in tables
        else set()
    )
    if "signup_token" in waitlist_columns:
        constraints = {c["name"] for c in inspector.get_unique_constraints("waitlist")}
        with op.batch_alter_table("waitlist") as batch_op:
            if "uq_waitlist_signup_token" in constraints:
                batch_op.drop_constraint("uq_waitlist_signup_token", type_="unique")
            batch_op.drop_column("signup_token")


def downgrade() -> None:
    """Restore the legacy fields as optional; their dropped data is not recovered."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.add_column(
            sa.Column(
                "signup_token",
                postgresql.UUID(as_uuid=False),
                nullable=True,
                server_default=sa.text("(gen_random_uuid())"),
            )
        )
        batch_op.create_unique_constraint("uq_waitlist_signup_token", ["signup_token"])

    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(sa.Column("title_hi", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("summary_hi", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("district", sa.String(100), nullable=True))

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
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("story_id", "url", name="uq_story_source_url"),
    )
