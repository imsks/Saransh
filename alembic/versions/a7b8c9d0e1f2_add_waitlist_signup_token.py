"""add waitlist signup_token

Gives every Waitlist Signup the opaque Signup Token specified in ADR-0004: a
stored UUID, distinct from the autoincrementing primary key, which is how a
Signup and the User they later become are recognised as one person.

The column is added nullable so existing rows can be backfilled with a distinct
token each, then made NOT NULL and unique.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-10-18 09:40:00.000000

"""

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    uuid_type = (
        postgresql.UUID(as_uuid=True)
        if bind.dialect.name == "postgresql"
        else sa.String(length=36)
    )

    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.add_column(sa.Column("signup_token", uuid_type, nullable=True))

    waitlist = sa.table("waitlist", sa.column("id"), sa.column("signup_token"))
    for (row_id,) in bind.execute(
        sa.select(waitlist.c.id).where(waitlist.c.signup_token.is_(None))
    ):
        bind.execute(
            waitlist.update()
            .where(waitlist.c.id == row_id)
            .values(signup_token=str(uuid.uuid4()))
        )

    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.alter_column("signup_token", existing_type=uuid_type, nullable=False)
        batch_op.create_unique_constraint("uq_waitlist_signup_token", ["signup_token"])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("waitlist") as batch_op:
        batch_op.drop_constraint("uq_waitlist_signup_token", type_="unique")
        batch_op.drop_column("signup_token")
