# 08 — Cloud Run deploy script, make target and DEPLOYMENT.md

**Issue**: [#38](https://github.com/imsks/Saransh/issues/38) · **Type**: AFK · **Blocked by**: 01 · **Blocks**: 09

Read [README.md](README.md) first.

## Why

Nothing in this repo — or in Rajniti — describes how the backend reaches Cloud Run. Rajniti's
Dockerfile carries the comment `# ── Production (Cloud Run / Supabase) ──` and that comment is the
whole of the documented deployment story for either product. "Deploy it the same way as Rajniti"
currently resolves to someone's shell history.

This slice writes down the pattern, for both products.

## Current state

- `Dockerfile` — a working `production` stage (gunicorn + uvicorn workers)
- `docker-compose.prod.yml` — API only, `.env`-driven
- `Makefile` — `setup`, `up`, `stop`
- No deploy script, no cloudbuild config, no CI deploy job
- `gcloud` is not assumed to be installed — the docs must say so

## What changes

`scripts/deploy_cloud_run.sh` builds the production image, pushes it to Artifact Registry, and
deploys that exact image. Plus `make deploy` and `docs/DEPLOYMENT.md`.

Three properties make the difference between a script and a note-to-self:

- **Tag with the commit SHA, never `latest`.** A mutable tag makes "which code is running?"
  unanswerable and makes rollback guesswork. Deploy the immutable reference.
- **Refuse a dirty working tree** unless explicitly overridden. A SHA tag on an image built from
  uncommitted changes is a lie, and it is the lie you discover during an incident.
- **No personal configuration baked in.** Project, region, repository, service name and instance
  bounds all come from env vars with documented defaults. Missing required values fail with a
  readable message, not a gcloud stack trace.

Per D6 this is human-triggered, not CI. Promotion to GitHub Actions with Workload Identity
Federation is a later step, deliberately not in this epic.

## Action plan

1. Write `scripts/deploy_cloud_run.sh`:
   - `set -euo pipefail`
   - validate required env vars up front, listing every missing one at once rather than failing on
     the first
   - refuse a dirty tree unless overridden by an explicit flag or env var
   - build `--target production`, tag with the short commit SHA
   - push to Artifact Registry, deploy that tag with `gcloud run deploy`
   - print the resulting service URL on success
2. Add `make deploy` wrapping the script.
3. Write `docs/DEPLOYMENT.md` covering:
   - **One-time setup** — install `gcloud`, the APIs to enable (Cloud Run, Artifact Registry),
     creating the Artifact Registry repository, the service account and its roles
   - **Runtime env vars** — `APP_ENV`, `DEBUG`, `DATABASE_URL`, `SARANSH_INGEST_API_KEY`,
     `CORS_ORIGINS`, and a note that Cloud Run injects `PORT`
   - **Migrations** — `alembic upgrade head` runs against the target database *before* the deploy,
     never from the app
   - **Rollback** — routing traffic back to a previous revision
   - **The D4 trade-off** — secrets are plain env vars: visible in the Cloud Run console and in
     local shell history; moving them to Secret Manager later is a service-config change, not a
     code change
4. `shellcheck` clean, `chmod +x`.
5. A test asserting the Makefile target and the script exist and reference the same entrypoint,
   following the pattern already in `tests/test_makefile.py`.

## Acceptance criteria

- [ ] Script builds the `production` target, pushes to Artifact Registry tagged with the commit SHA,
      deploys that image
- [ ] All configuration from env vars with defaults; missing required values fail readably
- [ ] Refuses to deploy from a dirty working tree unless explicitly overridden
- [ ] `make deploy` wraps the script
- [ ] `docs/DEPLOYMENT.md` covers one-time setup, runtime env vars, migrations, rollback, and the
      secret trade-off
- [ ] `shellcheck` clean and executable
- [ ] A test asserts the Makefile target and script agree
- [ ] `pytest tests/ -q` green

## How to verify

```bash
shellcheck scripts/deploy_cloud_run.sh
scripts/deploy_cloud_run.sh            # no env set: lists every missing var, exits non-zero
```

A real deploy is slice 09 — this slice is verified without GCP credentials.

## Out of scope

GitHub Actions / Cloud Build CI, Secret Manager, custom domains, and any deploy tooling for the
frontend (slice 10).
