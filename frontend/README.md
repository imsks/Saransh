# Saransh Frontend

The Next.js frontend for Saransh: today the landing page, the waitlist and the privacy page. The reader app (a swipeable story deck with Google sign-in) is planned and not built.

What is built, how it works and what is planned: [`docs/PROJECT_STATE.md`](../docs/PROJECT_STATE.md), sections 8, 9 and 14. If your change makes that file wrong, update it in the same pull request.

## Development

From the repo root, the whole stack runs in Docker:

```bash
make setup   # copies .env.example → .env and frontend/.env.example → frontend/.env
make up      # API :8001 + frontend :3001 + Postgres :5433
```

Or run the frontend alone from this directory (the API must be reachable at `NEXT_PUBLIC_API_URL`):

```bash
npm ci
npm run dev        # http://localhost:3001
```

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Environment

Copy `frontend/.env.example` → `frontend/.env` (or run `make setup` from the repo root).

The `NEXTAUTH_*` and `GOOGLE_CLIENT_*` keys are placeholders: Saransh has no sign-in yet. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a leftover; analytics will be PostHog ([ADR 0004](../docs/adr/0004-posthog-for-saransh-analytics.md)) and is not built. On Vercel, do **not** set the localhost `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` — `getSiteUrl()` falls back to `VERCEL_URL`. Vercel should carry only the production `NEXT_PUBLIC_API_URL`.

## Rules worth knowing before you touch the UI

`frontend/.env.example` mirrors Rajniti's key names (NextAuth/Google are placeholders — Saransh has no sign-in yet). Analytics runs on PostHog: set `NEXT_PUBLIC_POSTHOG_KEY` (and optionally `NEXT_PUBLIC_POSTHOG_HOST`) to enable it; with no key every analytics entry point is a no-op, which is how local development and CI run. On Vercel, do **not** set the localhost `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` — `getSiteUrl()` falls back to `VERCEL_URL`. Vercel should carry only the production `NEXT_PUBLIC_API_URL`.

House rules in full: [`CONTRIBUTING.md`](../CONTRIBUTING.md). Agent brief: [`.github/agents/frontend-agent.md`](../.github/agents/frontend-agent.md).
