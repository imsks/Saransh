# Deployment

FastAPI runs on Cloud Run, Next.js on Vercel and PostgreSQL on Supabase.
Supabase supplies the database only, not auth or an SDK. Deployments are manual;
there is no CI deployment job.

## Database safety

Production shares a database with Rajniti. Saransh owns `stories` and
`waitlist`, with revision tracking in `alembic_version_saransh`. Rajniti's `users`
and `alembic_version` must remain untouched. Autogenerate filters ownership through
[ownership.py](../app/db/ownership.py); manually written revisions still need review.

Revision `b8c9d0e1f2a3` is expand-only on existing databases: it retains `sources`,
Hindi text, district and `signup_token` so the old API can keep serving while the
replacement deploys (or if deployment fails). It adds `source_label` and a
PostgreSQL 13+ `gen_random_uuid()` default for token-free waitlist inserts.
Matching canonical URLs retain their outlet labels. Stories without a canonical
URL use their oldest source, ordered by `created_at`, then `id`; unmatched URLs
remain unchanged and unlabeled. All source rows are retained.

Deploy this revision before retiring the old API. Physical removal of the legacy
schema is deferred to a separate, later contract rollout, after all old revisions
and writers are retired and rollback to them is disabled. Before that cleanup,
take a `pg_dump` and repeat the citation backfill for writes made by old revisions
during the transition. Do not add destructive cleanup to this pre-deploy migration.

Saransh maps Rajniti's `users` table to create Users and fill NULL onboarding
answers, but never creates or migrates it in production; `make migrate` creates a
local stand-in only. Before the first production sign-in, compare `\d users` with
the `User` model in [models.py](../app/db/models.py).

Install backend requirements in `venv` or the Python 3 environment on PATH.
Export `DATABASE_URL` from a secure source, using Supabase's session-mode pooler
on port 5432 rather than its IPv6-only direct endpoint, then:

```bash
CONFIRM_PROD=1 make migrate-prod
```

The runner creates current tables only for an empty Saransh schema and stamps
them at head. It also adopts an unversioned schema that matches the models exactly.
Tracked schemas receive normal Alembic upgrades. Partial or drifted unversioned
schemas are refused without stamping. Do not guess a revision to bypass that check.

For an old unstamped database, inspect its tables and migration effects, identify
the newest revision already present, and only then use `alembic stamp <revision>`
with the explicit target URL. Retry the production command to apply the remainder.
The shared database was initially adopted at `b2c3d4e5f6a7` on 2026-10-01;
that historical baseline is not a universal stamp instruction.

For new schema changes, run `alembic revision --autogenerate -m "description"`
against a verified local `DATABASE_URL`, review the revision and run `make migrate`.
Preserve applied history. Non-backwards-compatible changes need an expand/migrate/
contract rollout so the old serving revision tolerates the transition.
Application startup does not create or migrate tables.

## Cloud Run setup

Install [gcloud](https://cloud.google.com/sdk/docs/install) and Docker with a
running daemon. The deploy account needs `roles/run.admin`,
`roles/artifactregistry.writer` and `roles/iam.serviceAccountUser` on the runtime
service account.

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create saransh \
  --repository-format=docker --location=asia-south1
```

## Deploy API

Export `GCP_PROJECT_ID`, `DATABASE_URL`, `SARANSH_INGEST_API_KEY` and `CORS_ORIGINS`
(the comma-separated frontend origins). The script reports every missing name.
Use a fresh production ingest secret, not the local development value.

```bash
./scripts/deploy_cloud_run.sh
```

The script builds the production image for `linux/amd64`, tags it with the commit
SHA, pushes it, runs the same production migration runner and deploys a Cloud Run
revision. Migration failure stops deployment. It refuses dirty trees unless
`ALLOW_DIRTY=1`; this override means the SHA no longer fully describes the image.

| Optional setting | Default |
| --- | --- |
| `GCP_REGION` | `asia-south1` |
| `ARTIFACT_REPOSITORY` | `saransh` |
| `CLOUD_RUN_SERVICE`, `IMAGE_NAME` | `saransh-api` |
| `MIN_INSTANCES`, `MAX_INSTANCES` | `0`, `4` |
| `LOG_LEVEL` | `INFO` |
| `SKIP_MIGRATIONS` | `0`; use `1` only for an intentional code-only rollout |

The script sets `APP_ENV=production` and `DEBUG=False`. Cloud Run injects `PORT`;
do not set it yourself. Scale-to-zero can cause cold starts.

Secrets are currently ordinary Cloud Run environment variables (decision D4).
They are visible to users who can inspect service configuration and can enter
shell history. Export them from a password manager rather than writing them inline.
Secret Manager is a future service-configuration change, not an app API change.

## Verify and roll back

```bash
SERVICE_URL=$(gcloud run services describe saransh-api \
  --region asia-south1 --format 'value(status.url)')
curl -fsS "$SERVICE_URL/api/v1/health"
curl -si -X OPTIONS "$SERVICE_URL/api/v1/waitlist" \
  -H "Origin: https://<frontend-origin>" \
  -H "Access-Control-Request-Method: POST"
```

Check the preflight's `access-control-allow-origin`. For rollback, switch traffic
to an existing immutable revision; this does not roll back database migrations:

```bash
gcloud run revisions list --service saransh-api --region asia-south1
gcloud run services update-traffic saransh-api --region asia-south1 \
  --to-revisions <previous-revision>=100
```

## Other container options

Cloud Build can build without a local Docker daemon:

```bash
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/<project>/saransh/saransh-api:$(git rev-parse --short HEAD)
```

The Dockerfile remains compatible with Cloud Build's legacy builder (no
BuildKit `RUN --mount`). [test_docker_compose.py](../tests/test_docker_compose.py)
guards this. Cloud Build's command above builds/pushes only; migrate and deploy separately.

For a self-hosted production API, `docker compose -f docker-compose.prod.yml up
--build -d` remains available. Supply its environment values and apply migrations
first; it is separate from the local four-command workflow.

## Vercel

Deploy from `frontend/` through Git integration or `vercel --prod`. Set
`NEXT_PUBLIC_API_URL` to the Cloud Run API base including `/api/v1`, and add the
Vercel origin to backend `CORS_ORIGINS`. Set a real `NEXT_PUBLIC_SITE_URL` or let
the resolver fall back to `VERCEL_URL`; do not ship localhost SEO settings.
Security/cache headers live in `frontend/vercel.json`.

Analytics and server-only API overrides are documented in the
[frontend guide](../frontend/README.md). Public environment changes require a
rebuild/redeploy. Do not add auth secrets: sign-in is not implemented.