# 09 — First production deploy to Cloud Run

**Issue**: [#39](https://github.com/imsks/Saransh/issues/39) · **Type**: HITL · **Blocked by**: 07, 08 · **Blocks**: 10

Read [README.md](README.md) first.

## Why

Everything before this is preparation. This is the slice where Saransh becomes a thing on the
internet rather than a thing on a laptop.

## Human judgement required

GCP credentials, and generating the production ingest key.

## Action plan

1. **Migrate first.** `alembic upgrade head` against the Saransh database from slice 07. Schema
   before traffic, always — a service that boots against a schema it does not expect fails in
   confusing ways.
2. **Generate a fresh `SARANSH_INGEST_API_KEY` for production.** Do not reuse a value that has ever
   sat in a local `.env`; local env files leak through screenshares, backups and shell history.
   `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
3. **Deploy** with `make deploy`, having set the runtime environment: `APP_ENV=production`,
   `DEBUG=False`, `DATABASE_URL`, `SARANSH_INGEST_API_KEY`, `CORS_ORIGINS`. `CORS_ORIGINS` is a
   chicken-and-egg with slice 10 — set it to the expected Vercel origin now and correct it there if
   the real URL differs.
4. **Smoke test the running service**, not the deploy output. A green deploy means the container
   started; it says nothing about whether the database is reachable or the key works. Run every
   check below.
5. **Record the cold-start behaviour.** Cloud Run scales to zero by default, so the first request
   after an idle period pays a cold start — for a gunicorn + SQLAlchemy image that is typically
   seconds, on the landing page, for a visitor forming a first impression. Measure it, then decide
   whether `--min-instances=1` is worth the cost. Either answer is fine; leave the measurement and
   the decision in a comment on the issue so it is not rediscovered as a mystery slowdown.
6. **Record the service URL** in `docs/DEPLOYMENT.md`.

## Acceptance criteria

- [ ] `alembic upgrade head` applied to the Saransh database before the service took traffic
- [ ] Service deployed; `GET /api/v1/health` returns healthy over HTTPS on the Cloud Run URL
- [ ] Runtime env set: `APP_ENV=production`, `DEBUG=False`, `DATABASE_URL`,
      `SARANSH_INGEST_API_KEY`, `CORS_ORIGINS`
- [ ] A fresh production ingest key generated and stored, never having been in a local `.env`
- [ ] Smoke tests below all pass against the live URL
- [ ] Cold-start latency measured and the min-instances decision recorded in an issue comment
- [ ] Service URL recorded in `docs/DEPLOYMENT.md`

## How to verify

```bash
URL=https://<service>.run.app

curl -fsS $URL/api/v1/health                                          # healthy
curl -s $URL/api/v1/stories | jq 'map(.status) | unique'              # ["published"] or []

curl -s -o /dev/null -w '%{http_code}\n' -X POST $URL/api/v1/stories \
  -H 'Content-Type: application/json' -d '{}'                          # 401 without a key

curl -s -o /dev/null -w '%{http_code}\n' -X POST $URL/api/v1/stories \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d @story.json   # 201

curl -s -X POST $URL/api/v1/waitlist -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","email":"smoke@example.com","language":"English"}'   # ok
curl -s -X POST $URL/api/v1/waitlist -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","email":"smoke@example.com","language":"English"}'   # duplicate: true

# cold start: leave it idle, then
curl -s -o /dev/null -w 'cold: %{time_total}s\n' $URL/api/v1/health
curl -s -o /dev/null -w 'warm: %{time_total}s\n' $URL/api/v1/health
```

Delete the smoke-test Story and Signup afterwards, or the first real Waitlist export contains
`smoke@example.com`.

## Out of scope

Custom domain, CDN, alerting and uptime monitoring, autoscaling tuning beyond the min-instances
call.
