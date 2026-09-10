# 06 — Guard the public Waitlist endpoint

**Issue**: [#34](https://github.com/imsks/Saransh/issues/34) · **Type**: AFK · **Blocked by**: none

Read [README.md](README.md) first.

## Why

`POST /api/v1/waitlist` (`app/api/waitlist.py:55`) is an unauthenticated write endpoint. Once it is
on the open internet, the only thing between it and a scripted flood is the unique constraint on
`waitlist.email` — which any script defeats by varying the address. The result is a Waitlist full
of addresses that never asked for anything, and a launch email that lands in spam folders.

## Current state

- `app/api/waitlist.py:55-93` — validates, normalises the email to lowercase, inserts, and treats
  `IntegrityError` as `{ok: true, duplicate: true}` with a 200
- `frontend/src/components/waitlist/WaitlistForm.tsx` — posts `{name, email, language, source}` and
  renders `payload.message` on a non-OK response
- No rate limiting anywhere in the app

## What changes

Two cheap guards, no third-party dependency and no captcha UX.

**IP rate limit.** Five Signups per IP per hour to start, configurable by env var. Over the limit
returns 429 with a JSON body the form can render.

**Honeypot.** A form field hidden from humans that bots fill in. When it arrives non-empty, the
server returns the *normal success shape* and writes nothing — the bot learns nothing from the
response and does not retry with a different strategy. Returning an error here would teach it that
the field is checked.

Two details decide whether this works at all:

- **The client IP must come from `X-Forwarded-For`, leftmost entry.** Behind Cloud Run's load
  balancer the socket peer is the balancer, so keying on it makes every request in the world share
  one bucket and locks out the second visitor. Fall back to the socket address when the header is
  absent (local dev).
- **The honeypot must not be `type="hidden"`.** Bots skip hidden inputs; they fill visible ones.
  Render a normal input positioned off-screen, with `aria-hidden`, `tabIndex={-1}` and
  `autoComplete="off"` so humans and screen readers never reach it.

The in-process limiter resets when an instance restarts and is per-instance, so with several Cloud
Run instances the effective limit is the configured number times the instance count. That is fine
at this scale and worth a comment in the code so nobody reads the number as a guarantee.

## Action plan

1. Add a rate limiter (`slowapi` fits FastAPI, or hand-roll a small in-process one — either is
   acceptable, the endpoint is one route). Limit configurable via env, default 5/hour.
2. Resolve the client IP from `X-Forwarded-For` leftmost, falling back to the socket address.
3. Apply the limit to the waitlist route only. Ingest is already key-protected; health must stay
   unlimited or the Cloud Run healthcheck will trip it.
4. Return 429 with a JSON body carrying a human-readable message.
5. Add an optional honeypot field to `WaitlistIn`. Non-empty → return the normal success shape and
   write nothing. Log it at debug so the volume is observable.
6. Add the hidden input to `WaitlistForm.tsx` per the rules above and include it in the POST body.
7. Surface the 429 message in the form instead of the generic failure text.
8. Tests: limit enforced; limit resets; honeypot rejected silently with a success shape and no row;
   a real Signup still succeeds; `X-Forwarded-For` parsing including a multi-hop header.

## Acceptance criteria

- [ ] Rate limit on the waitlist endpoint only, configurable via env with a sane default
- [ ] Client IP resolved from `X-Forwarded-For` leftmost, falling back to the socket address
- [ ] Over the limit returns 429 with a JSON body the form renders
- [ ] Non-empty honeypot returns `{ok: true}` and writes no row
- [ ] `WaitlistForm.tsx` renders the honeypot hidden from assistive tech (not `type="hidden"`) and
      posts it
- [ ] The form shows the 429 message rather than the generic error
- [ ] Health and ingest endpoints are unaffected
- [ ] Backend and frontend suites green

## How to verify

```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code} " -X POST localhost:8001/api/v1/waitlist \
    -H 'Content-Type: application/json' -H 'X-Forwarded-For: 203.0.113.9' \
    -d "{\"name\":\"Test $i\",\"email\":\"t$i@example.com\",\"language\":\"English\"}"
done   # expect 201 201 201 201 201 429
```

## Out of scope

Cloudflare Turnstile, email confirmation, and any shared/distributed rate-limit store.
