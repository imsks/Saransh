# Frontend

Next.js 14 and React 18. The landing page renders static sample stories; the
waitlist submits to FastAPI. There is no sign-in or live reader feed.

Use `make up` from the repository root for the full local stack. For a host-only
frontend, copy `.env.example` to `.env`, run `npm ci`, then `npm run dev`.
The API must be reachable at the configured URL. See [CONTRIBUTING.md](../CONTRIBUTING.md)
for host-only backend setup and required checks.

## Environment

[.env.example](.env.example) documents the available settings.

- `NEXT_PUBLIC_API_URL`: browser API base URL, including `/api/v1`.
- `API_URL`: optional server-side API base URL.
- `API_REWRITE_TARGET`: optional server-only origin for Next.js API rewrites; Docker uses the API service hostname.
- `NEXT_PUBLIC_SITE_URL`: canonical site origin. In production omit localhost values; the resolver can fall back to `VERCEL_URL`.
- `NEXT_PUBLIC_LOG_LEVEL`: frontend logging level.

## Analytics

Set `NEXT_PUBLIC_POSTHOG_KEY` to enable PostHog. The dashboard's
`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` alias is also supported; choose one.
With no token the SDK is not loaded and no analytics requests are sent.
Rebuild or redeploy after changing public environment values.

Events go through the first-party `/ingest` proxy to PostHog Cloud US by default.
Host/proxy overrides are optional. Session replay is disabled. Never send names,
emails or other personal data to analytics, and never use events to personalize stories.

Use `analytics` from `@/lib/analytics`, not the SDK directly. Event definitions
are in [events.ts](src/lib/analytics/events.ts).
The waitlist funnel is `waitlist_form_viewed` -> `waitlist_form_started` ->
`waitlist_submitted`, filtered to `outcome = created` for new signups.
See [ADR 0004](../docs/adr/0004-posthog-for-saransh-analytics.md).

## UI

Use the existing light/dark theme tokens and Sutra primitives where they fit.
Keep source links visible, keyboard controls usable and mobile layouts intact.
Shared components belong in [Sutra](https://github.com/imsks/sutra-ui), not a local copy.
The full contribution rules live in [CONTRIBUTING.md](../CONTRIBUTING.md).