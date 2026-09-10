# Separate Database for Saransh

Saransh owns its own Postgres database, provisioned separately from Rajniti's. The link between a Story and an elected representative is an HTTP call to Rajniti's API, not a foreign key.

**Context**: Saransh was bootstrapped alongside Rajniti and inherited its database — `DATABASE_URL` defaulted to the `rajniti` database, and `app/db/bootstrap.py` added the Saransh-owned tables (`stories`, `sources`, `waitlist`) to it via `Base.metadata.create_all()` at startup. Convenient locally, but it does not survive contact with a production Cloud Run deploy. Rajniti applies schema changes with Alembic while Saransh created tables implicitly, so two migration strategies pointed at one database. A shared database also couples the two products' uptime, connection-pool budget, and backup windows, and neither service's credential can be scoped to its own data. The workloads differ too: Rajniti is read-heavy over a slow-changing election dataset, Saransh writes continuously from ingestion agents.

The alternative — one shared database — is cheaper and would let the Rajniti cross-link be a SQL join rather than a network call.

**Decision**: Provision a separate Saransh database with its own credentials. Remove the `rajniti` default from `app/config.py`. Apply schema changes with Alembic; keep `create_all()` for local development and tests only. Neither product reads the other's tables. This follows the independence already established in [FastAPI Backend with Async Support](./0001-fastapi-backend.md) — the shared layer between the products is the UI, not the data.

**Consequences**: A Rajniti incident or a bad migration can no longer take Saransh down, and each service holds a credential scoped to its own data. Saransh's migration history stands alone. In exchange, enriching a Story with representative data costs a network round trip and needs its own caching and failure handling — it must be able to fail without failing the Story. Two databases to back up and monitor, and any existing rows in the shared database must be moved across before cutover.
