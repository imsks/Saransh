# Frontend

Next.js 14 and React 18. The landing page renders static sample stories and
`/stories` server-renders the latest published Stories from FastAPI.

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

Set `NEXT_PUBLIC_POSTHOG_KEY` to enable PostHog; without it the SDK is never
initialised. Rebuild or redeploy after changing public environment values.

[AnalyticsProvider](src/components/providers/AnalyticsProvider.tsx) is the whole
setup: events go through the first-party `/ingest` proxy to PostHog Cloud US,
pageviews and clicks are captured automatically and session replay is off.
Call `posthog.capture` directly for the few funnel events. Never send names,
emails or other personal data, and never use events to personalize stories.

## UI

Use the existing light/dark theme tokens and Sutra primitives where they fit.
Keep source links visible, keyboard controls usable and mobile layouts intact.
Shared components belong in [Sutra](https://github.com/imsks/sutra-ui), not a local copy.
The full contribution rules live in [CONTRIBUTING.md](../CONTRIBUTING.md).