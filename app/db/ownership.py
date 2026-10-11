"""Which tables Saransh's migrations are allowed to touch.

Production Postgres is shared with Rajniti (ADR 0006). Alembic autogenerate
compares the whole database against Saransh's models, so without these filters
it reads every Rajniti table as "not in the models" and proposes dropping it.
"""

from __future__ import annotations

from typing import Optional

# Register a new Saransh table here in the same change that adds its model.
# Never list a table another product owns (e.g. Rajniti's `users`), even if
# Saransh maps a model over it.
SARANSH_OWNED_TABLES = frozenset({"stories", "sources", "waitlist"})


def include_name(name: Optional[str], type_: str, parent_names: dict) -> bool:
    """Reflect only Saransh-owned tables from the database."""
    if type_ == "table":
        return name in SARANSH_OWNED_TABLES
    return True


def include_object(obj, name: Optional[str], type_: str, reflected, compare_to) -> bool:
    """Skip any table, and anything on a table, that Saransh does not own."""
    if type_ == "table":
        return name in SARANSH_OWNED_TABLES
    table = getattr(obj, "table", None)
    if table is not None:
        return table.name in SARANSH_OWNED_TABLES
    return True
