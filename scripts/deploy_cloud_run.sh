#!/usr/bin/env bash
#
# Build the production image, push it to Artifact Registry and deploy it to Cloud Run.
#
# Every setting comes from the environment — nothing personal is baked in. See
# docs/DEPLOYMENT.md for one-time setup and the full variable reference.

set -euo pipefail

readonly SCRIPT_NAME="${0##*/}"

die() {
    echo "${SCRIPT_NAME}: $*" >&2
    exit 1
}

# ── Configuration ─────────────────────────────────────────────────────────────

GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
GCP_REGION="${GCP_REGION:-asia-south1}"
ARTIFACT_REPOSITORY="${ARTIFACT_REPOSITORY:-saransh}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-saransh-api}"
IMAGE_NAME="${IMAGE_NAME:-saransh-api}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-4}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"

# Runtime environment for the service itself.
DATABASE_URL="${DATABASE_URL:-}"
SARANSH_INGEST_API_KEY="${SARANSH_INGEST_API_KEY:-}"
CORS_ORIGINS="${CORS_ORIGINS:-}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# ── Validation ────────────────────────────────────────────────────────────────

# Collect every problem before exiting so one run tells you everything that is wrong.
missing=()
[[ -n "$GCP_PROJECT_ID" ]] || missing+=("GCP_PROJECT_ID — your Google Cloud project id")
[[ -n "$DATABASE_URL" ]] || missing+=("DATABASE_URL — Postgres connection string for production")
[[ -n "$SARANSH_INGEST_API_KEY" ]] || missing+=("SARANSH_INGEST_API_KEY — guards POST /api/v1/stories")
[[ -n "$CORS_ORIGINS" ]] || missing+=("CORS_ORIGINS — comma-separated frontend origins")

if ((${#missing[@]} > 0)); then
    echo "${SCRIPT_NAME}: missing required environment variables:" >&2
    printf '  - %s\n' "${missing[@]}" >&2
    echo >&2
    echo "See docs/DEPLOYMENT.md for the full reference." >&2
    exit 1
fi

command -v gcloud >/dev/null 2>&1 || die "gcloud is not installed. See docs/DEPLOYMENT.md."
command -v docker >/dev/null 2>&1 || die "docker is not installed."

cd "$(dirname "$0")/.."

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repository."

if [[ -n "$(git status --porcelain)" && "$ALLOW_DIRTY" != "1" ]]; then
    die "working tree is dirty. Commit first, or set ALLOW_DIRTY=1 to tag a build that no commit describes."
fi

# ── Build, push, deploy ───────────────────────────────────────────────────────

COMMIT_SHA="$(git rev-parse --short HEAD)"
readonly REGISTRY="${GCP_REGION}-docker.pkg.dev"
readonly IMAGE="${REGISTRY}/${GCP_PROJECT_ID}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${COMMIT_SHA}"

echo "==> Deploying ${CLOUD_RUN_SERVICE} to ${GCP_REGION} (${GCP_PROJECT_ID})"
echo "    image: ${IMAGE}"

echo "==> Authenticating Docker against ${REGISTRY}"
gcloud auth configure-docker "$REGISTRY" --quiet

echo "==> Building production image"
docker build --target production --platform linux/amd64 -t "$IMAGE" .

echo "==> Pushing image"
docker push "$IMAGE"

echo "==> Deploying revision"
# Cloud Run injects PORT itself, so it is deliberately absent from --set-env-vars.
gcloud run deploy "$CLOUD_RUN_SERVICE" \
    --project "$GCP_PROJECT_ID" \
    --region "$GCP_REGION" \
    --image "$IMAGE" \
    --platform managed \
    --allow-unauthenticated \
    --min-instances "$MIN_INSTANCES" \
    --max-instances "$MAX_INSTANCES" \
    --set-env-vars "APP_ENV=production,DEBUG=False,LOG_LEVEL=${LOG_LEVEL},DATABASE_URL=${DATABASE_URL},SARANSH_INGEST_API_KEY=${SARANSH_INGEST_API_KEY},CORS_ORIGINS=${CORS_ORIGINS}" \
    --quiet

SERVICE_URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
    --project "$GCP_PROJECT_ID" \
    --region "$GCP_REGION" \
    --format 'value(status.url)')"

echo
echo "==> Deployed ${COMMIT_SHA} to ${SERVICE_URL}"
echo "    health: ${SERVICE_URL}/api/v1/health"
