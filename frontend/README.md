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

The `NEXTAUTH_*` and `GOOGLE_CLIENT_*` keys back Google sign-in. Getting real values is a one-time console job — [`docs/google-oauth-setup.md`](../docs/google-oauth-setup.md) — and nothing in the app reads them until the sign-in slices land, so the placeholders are enough to run everything that exists today. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a leftover; analytics will be PostHog ([ADR 0004](../docs/adr/0004-posthog-for-saransh-analytics.md)) and is not built. On Vercel, do **not** set the localhost `NEXT_PUBLIC_SITE_URL`; `NEXTAUTH_URL` must be set there, to the production origin, because a Google redirect URI cannot match Vercel's per-deployment hostname.

## Rules worth knowing before you touch the UI

- All data calls go through FastAPI on `:8001`; there are no Next.js API routes today.
- Style with the theme colour names (`bg-paper`, `text-ink`, `border-line`), never a hex value.
- Reach for a [Sutra](https://github.com/imsks/sutra-ui) component before hand-writing one.
- Anything a reader sees must work in both Hindi and English, and in light and dark.

House rules in full: [`CONTRIBUTING.md`](../CONTRIBUTING.md). Agent brief: [`.github/agents/frontend-agent.md`](../.github/agents/frontend-agent.md).
