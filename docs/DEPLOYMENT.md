# Deploying Saransh

The API runs on **Cloud Run**; the frontend runs on **Vercel**. This mirrors how Rajniti is
hosted, with different ports and service names.

Deploys are triggered by a human running a committed script — there is no CI deploy job. That is
a deliberate choice (decision D6); promoting it to GitHub Actions with Workload Identity
Federation is a later step.

```bash
make deploy
```

---

## One-time setup

`gcloud` is not assumed to be installed. Get it from
[cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), then:

```bash
gcloud auth login
gcloud config set project <your-project-id>

# APIs the deploy needs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# The registry the images are pushed to (once per project)
gcloud artifacts repositories create saransh \
    --repository-format=docker \
    --location=asia-south1 \
    --description="Saransh container images"
```

The account running the deploy needs `roles/run.admin`, `roles/artifactregistry.writer`, and
`roles/iam.serviceAccountUser` on the Cloud Run runtime service account.

---

## Deploy configuration

These are read by `scripts/deploy_cloud_run.sh`. Anything without a default is required, and the
script lists *every* missing variable at once rather than failing on the first.

| Variable | Default | Purpose |
|---|---|---|
| `GCP_PROJECT_ID` | — **required** | Google Cloud project id |
| `GCP_REGION` | `asia-south1` | Cloud Run region and Artifact Registry location |
| `ARTIFACT_REPOSITORY` | `saransh` | Artifact Registry repository name |
| `CLOUD_RUN_SERVICE` | `saransh-api` | Cloud Run service name |
| `IMAGE_NAME` | `saransh-api` | Image name within the repository |
| `MIN_INSTANCES` | `0` | Scale to zero between deploys; expect a cold start |
| `MAX_INSTANCES` | `4` | Upper bound on concurrent instances |
| `ALLOW_DIRTY` | `0` | Set to `1` to deploy from an uncommitted tree |

## Runtime configuration

Passed to the service as plain Cloud Run environment variables.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — **required** | Postgres connection string. For Supabase use the **session-mode pooler** (port `5432`), not the IPv6-only direct host |
| `SARANSH_INGEST_API_KEY` | — **required** | Guards `POST /api/v1/stories`. Use a fresh secret, never the local dev one |
| `CORS_ORIGINS` | — **required** | Comma-separated browser origins, e.g. `https://saransh.vercel.app` |
| `LOG_LEVEL` | `INFO` | Backend log level; JSON output when `APP_ENV=production` |
| `APP_ENV` / `DEBUG` | set by the script | Pinned to `production` / `False` |

**`PORT` is not in this table on purpose.** Cloud Run injects it (8080 by default) and the
container binds whatever it is given. Setting it yourself fights the platform.

---

## Images are tagged with the commit SHA

The script tags each image with the short commit SHA and never with `latest`. A mutable tag makes
"which code is running?" unanswerable and turns rollback into guesswork. For the same reason the
script refuses to deploy from a dirty working tree unless you set `ALLOW_DIRTY=1` — a SHA tag on
an image built from uncommitted changes is a lie, and it is the lie you discover mid-incident.

Images are built for `linux/amd64` explicitly, because Cloud Run will not run the `arm64` image an
Apple Silicon machine would otherwise produce.

---

## Migrations

Alembic owns the schema (decision D5). Run migrations against the target database **before**
deploying, never from application startup — `create_all()` cannot alter a column and races across
instances.

```bash
DATABASE_URL='<production-url>' alembic upgrade head
make deploy
```

A migration that is not backwards compatible with the currently-running revision needs the usual
two-step: deploy a revision that tolerates both shapes, migrate, then deploy the revision that
requires the new shape.

---

## Rollback

Revisions are immutable, so rolling back is a traffic change rather than a rebuild.

```bash
gcloud run revisions list --service saransh-api --region asia-south1

gcloud run services update-traffic saransh-api \
    --region asia-south1 \
    --to-revisions <previous-revision>=100
```

---

## Verifying a deploy

```bash
SERVICE_URL=$(gcloud run services describe saransh-api \
    --region asia-south1 --format 'value(status.url)')

curl -fsS "$SERVICE_URL/api/v1/health"

# Preflight from the deployed frontend origin — expect access-control-allow-origin back
curl -si -X OPTIONS "$SERVICE_URL/api/v1/waitlist" \
    -H "Origin: https://<your-frontend-origin>" \
    -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
```

---

## Secrets are plain environment variables

Decision D4: `DATABASE_URL` and `SARANSH_INGEST_API_KEY` ride as ordinary Cloud Run env vars. The
trade-off is real and accepted — the values are visible in the Cloud Run console, in
`gcloud run services describe`, and in the shell history of whoever deployed. Prefer exporting them
from a password manager over typing them inline.

Moving to Secret Manager later is a service-config change, not a code change: the app reads the
same variable names either way.

---

## Building without local Docker

`make deploy` builds locally and pushes. If you would rather build in the cloud:

```bash
gcloud builds submit --tag asia-south1-docker.pkg.dev/<project>/saransh/saransh-api:$(git rev-parse --short HEAD)
```

Note that Cloud Build's default `docker` step runs the **legacy** builder, which rejects BuildKit
syntax such as `RUN --mount`. The `Dockerfile` is deliberately kept legacy-compatible so this path
keeps working; `tests/test_dockerfile.py` guards it.

---

## Frontend

The frontend deploys to Vercel from the `frontend/` directory, via the Git integration or
`vercel --prod`. Set `NEXT_PUBLIC_API_URL` to the Cloud Run service URL in the Vercel project, and
add that Vercel origin to `CORS_ORIGINS` on the API. `frontend/vercel.json` carries the security
and cache headers.

Environment ownership: local values live in `frontend/.env.example` (mirroring Rajniti's key
names). Vercel should carry only the production `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_ORIGIN`.
Do **not** set the localhost `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` on Vercel — `getSiteUrl()`
falls back to `VERCEL_URL` for canonical/OG URLs. The `NEXTAUTH_*`, `GOOGLE_CLIENT_*`, and
`NEXT_PUBLIC_GA_MEASUREMENT_ID` keys are placeholders for parity with Rajniti and stay unused until
sign-in or analytics ship.
