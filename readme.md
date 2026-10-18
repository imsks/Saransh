# Saransh

An open-source news project for India. The deployed site is a landing page with
static sample stories, a waitlist and a privacy page, not a live reader app.

## Current scope

- FastAPI endpoints ingest, list and serve stories, with source attribution.
- Waitlist signup returns an opaque token, including for repeat signups.
- Optional PostHog events measure navigation and the waitlist funnel. No session replay.
- Docker runs the API, frontend and PostgreSQL locally. Deployment uses Cloud Run and Vercel.

The reader app, sign-in, review pipeline and word-limit enforcement are not built.
The temporary [ingest routine](docs/story-ingest-routine.md) publishes directly to
the API without human review and may use publisher images. Those API stories are
not wired into the landing-page carousel.

## Run locally

Install Docker with Compose v2 and start its daemon. From the repository root:

```bash
make up
```

This copies missing environment templates, starts PostgreSQL, initializes or
migrates the database, then starts the API and frontend. Existing environment
files and database data are preserved. The first run builds images and installs
dependencies.

Frontend: http://localhost:3001. API docs: http://localhost:8001/docs.
Health: http://localhost:8001/api/v1/health. Host PostgreSQL port: `5433`.

| Command | Purpose |
| --- | --- |
| `make up` | Migrate and start the local stack |
| `make stop` | Stop the stack, preserving database data |
| `make migrate` | Start local PostgreSQL and apply all schema work in one run |
| `make migrate-prod` | Migrate an explicitly supplied production database |

Production migrations require exported `DATABASE_URL` and `CONFIRM_PROD=1`, plus
installed backend Python requirements. They never use the local Docker database.
The runner initializes empty tables, adopts a matching unversioned schema and
upgrades tracked revisions. It refuses partial or mismatched unversioned tables
rather than guessing their migration baseline.

Local connections use `postgres:5432` inside Docker and `127.0.0.1:5433` on the
host. Default local user, password and database are `rajniti`; Compose overrides
are in [.env.example](.env.example). Local migrations are pinned to Compose's
database, not a remote URL from your environment.

## Guides

- [Contributing](CONTRIBUTING.md): host-only setup, tests, review and code rules.
- [Frontend](frontend/README.md): frontend environment and analytics configuration.
- [Deployment](docs/DEPLOYMENT.md): production migrations, deployment and rollback.
- [Domain and decisions](CONTEXT.md): product terminology, planned scope and ADRs.

Backend settings: [.env.example](.env.example).
Frontend settings: [frontend/.env.example](frontend/.env.example).
Keep secrets out of commits. Ingest requires `X-API-Key`; waitlist and story reads
are public. See the API docs for request and response schemas.

Production shares PostgreSQL with [Rajniti](https://rajniti-app.vercel.app).
Saransh owns only `stories`, `sources`, `waitlist` and its migration version table;
its migrations must not touch Rajniti's tables.

Report bugs and attribution errors through [GitHub Issues](https://github.com/imsks/Saransh/issues).
[MIT License](LICENSE). Product and documentation: Pratyusha Trivedi.