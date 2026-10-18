# Backend API Agent

Read the files being changed before relying on this brief. Current functionality
is in [readme.md](../../readme.md); terminology and planned product rules are in
[CONTEXT.md](../../CONTEXT.md). Contribution, security, testing and pipeline rules
are in [CONTRIBUTING.md](../../CONTRIBUTING.md), with decisions in
[docs/adr](../../docs/adr) and migration/deploy instructions in
[DEPLOYMENT.md](../../docs/DEPLOYMENT.md).

## Backend-specific guidance

- Use FastAPI, Pydantic 2, SQLAlchemy 2, Alembic and structlog; Python 3.11+ is the supported setup.
- HTTP lives in `app/api`, validated shapes in `app/schemas`, persistence in `app/db/repositories`, tables in `app/db/models.py`.
- Read the neighboring endpoint before designing responses. Use response models for schema-driven endpoints and HTTPException for errors; preserve the waitlist's explicit JSONResponse 201/200 contract.
- Register routers in `app/api/__init__.py`; all routes are under `/api/v1`. Protect ingest writes with `require_api_key`, not public signup.
- Use UUID resource IDs, bounded pagination and validated query parameters. Do not delete a wrong Story when correction/retraction is the appropriate product action.
- Log through `get_logger(__name__)` with dotted event names, never credentials or personal data.
- Settings belong in `app/config.py` and the environment template, not router-level `os.environ` reads.
- Model changes use the existing Column style and CreatedAtMixin. Register new owned tables in `app/db/ownership.py`; never register Rajniti's tables.
- Keep the isolated Alembic version table and ownership filters. Do not rewrite applied migrations or bypass production consent.
- Tests use in-memory SQLite and existing fixtures/router loading in `tests/conftest.py`; use saved Source fixtures, never live feeds.
- An Agent may draft or flag, never approve. Planned pipeline work records model/prompt versions and reviewer corrections, attributes claims and fails per Story.
- Future authentication follows ADR 0005: verify identity on the backend and resolve the acting user from its verified token, never a browser-supplied user ID.

The stopgap publishes on ingest today; human review and enforced word limits are
not implemented. Do not invent an existing pipeline or scaffold empty directories
from an older plan. Use the existing owner of behavior and add a layer only when
it removes real complexity. Run the checks in CONTRIBUTING before finishing.