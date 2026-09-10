# 01 — Cloud Run runtime contract

**Issue**: [#31](https://github.com/imsks/Saransh/issues/31) · **Type**: AFK · **Blocked by**: none · **Blocks**: 08

Read [README.md](README.md) first.

## Why

Two things stop the current image serving traffic on Cloud Run, and neither shows up locally.

Cloud Run injects `PORT` (8080 by default) and expects the container to listen on it. The
production `CMD` in `Dockerfile:50` does bind `${PORT:-8001}`, so that part works by luck — but
`EXPOSE 8001` (`Dockerfile:48`) and the compose healthcheck at
`docker-compose.prod.yml:14` both hardcode 8001. Nothing in the test suite ever starts the
container on a different port, so an 8080 regression would ship silently.

Worse, `main.py:26` hardcodes the CORS allowlist to `http://localhost:3001` and
`http://127.0.0.1:3001`. A browser on any deployed frontend origin gets blocked by the preflight.
Since the frontend is a separate Vercel origin (D7), the deployed site cannot talk to the deployed
API at all until this changes.

## Current state

- `main.py:24-31` — `CORSMiddleware` with a literal two-entry `allow_origins` list,
  `allow_methods=["GET", "POST", "OPTIONS"]`, `allow_headers=["*"]`
- `app/config.py` — a plain `Settings` class reading `os.getenv`, no CORS setting
- `Dockerfile:48-50` — `EXPOSE 8001`; gunicorn binds `${PORT:-8001}`
- `docker-compose.prod.yml:12-14` — port mapping and healthcheck both pinned to 8001
- `tests/test_dockerfile.py`, `tests/test_docker_compose.py` — assert on the current literals and
  will need updating rather than deleting

## What changes

`CORS_ORIGINS` becomes a setting, parsed from a comma-separated environment variable, defaulting to
today's local dev origins so `make up` is unaffected. The middleware is built from it.

The port story becomes consistent: whatever `PORT` says, the app listens there and the healthcheck
checks there. Note that `PATCH` joins the allowed methods list — slice 05 adds a PATCH route, and a
preflight for it will fail if the list is not widened. Do it here, in the one place CORS is
configured.

## Action plan

1. Add `CORS_ORIGINS` to `app/config.py`. Parse the raw env var by splitting on `,`, stripping
   whitespace, and dropping empties. Default `"http://localhost:3001,http://127.0.0.1:3001"`.
   Expose it as a `List[str]`.
2. Rewrite the middleware block in `main.py` to read `settings.CORS_ORIGINS`. Add `PATCH` to
   `allow_methods`.
3. Make the port consistent: `EXPOSE 8080` on the production stage (documentation only, but it
   should not lie), and change the `docker-compose.prod.yml` healthcheck to hit the port the
   service is actually bound to rather than a hardcoded 8001.
4. Document `CORS_ORIGINS` in `.env.example` with both the local default and a production example.
5. Tests:
   - parsing — single origin, multiple, whitespace around entries, trailing comma, empty string
   - a preflight `OPTIONS` from a configured origin returns the `access-control-allow-origin`
     header; one from an unconfigured origin does not
   - update the existing Dockerfile and compose assertions to match the new port handling

## Acceptance criteria

- [ ] `CORS_ORIGINS` on `Settings`, comma-separated, trimmed, empties dropped
- [ ] Default preserves the current local dev origins; `make up` works untouched
- [ ] `main.py` builds the allowlist from the setting, and `PATCH` is an allowed method
- [ ] `docker run -e PORT=8080 -p 8080:8080 <image>` serves `/api/v1/health` on 8080
- [ ] The production healthcheck targets the injected port, not a literal 8001
- [ ] `.env.example` documents the variable with a production example
- [ ] Existing Dockerfile/compose tests updated, not deleted; `pytest tests/ -q` green

## How to verify

```bash
docker build --target production -t saransh-api:local .
docker run --rm -e PORT=8080 -e APP_ENV=production -p 8080:8080 saransh-api:local &
curl -fsS http://localhost:8080/api/v1/health

# preflight from an allowed origin — expect access-control-allow-origin in the response
curl -si -X OPTIONS http://localhost:8080/api/v1/waitlist \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
```

## Out of scope

Secret Manager, the deploy script itself (slice 08), and any change to what the endpoints return.
