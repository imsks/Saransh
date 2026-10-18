"""prepare citation labels and token-free waitlist inserts

Expand-only: keep legacy fields and sources until old API revisions are retired.
Existing canonical URLs keep their matching outlet; older stories use the oldest
source (created_at, then id). Unmatched canonical URLs are left unattributed.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-18 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("stories") as batch_op:
        batch_op.add_column(sa.Column("source_label", sa.Text(), nullable=True))

    op.execute(sa.text("""
            UPDATE stories
            SET source_label = (
                SELECT outlet FROM sources
                WHERE story_id = stories.id
                  AND (url = stories.source_url OR stories.source_url IS NULL)
                ORDER BY created_at, id LIMIT 1
            ),
            source_url = COALESCE(source_url, (
                SELECT url FROM sources
                WHERE story_id = stories.id
                ORDER BY created_at, id LIMIT 1
            ))
            """))

    # Old revisions still return tokens; new code omits them on INSERT.
    # PostgreSQL 13+ supplies gen_random_uuid() without an extension.
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.alter_column(
            "signup_token", server_default=sa.text("(gen_random_uuid())")
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.alter_column("signup_token", server_default=None)

    with op.batch_alter_table("stories") as batch_op:
        batch_op.drop_column("source_label")
