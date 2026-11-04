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
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google sign-in.
- `SARANSH_INTERNAL_API_KEY`: server-only key for FastAPI's User endpoints; equals the backend value.

## Sign-in

[auth.ts](src/lib/auth.ts) runs Google sign-in through next-auth. On sign-in the
server syncs the User with FastAPI through [server-api.ts](src/lib/server-api.ts),
the only code that holds the internal key. The browser session carries the User's
id, name, email, image and onboarding state, never a token or key.

Sign-in returns to `/onboarding`, which shows only the questions FastAPI reports
as unanswered and submits them through a server action. [middleware.ts](src/middleware.ts)
sends a signed-in User with unanswered questions from `/stories` to `/onboarding`;
guests read `/stories` freely.

## Analytics

Set `NEXT_PUBLIC_POSTHOG_KEY` to enable PostHog; without it the SDK is never
loaded. Rebuild or redeploy after changing public environment values.

[analytics.ts](src/lib/analytics.ts) is the whole setup. It loads the SDK on
demand (outside the first-load bundle) and sends events through the first-party
`/ingest` proxy to PostHog Cloud US. Pageviews and clicks are captured
automatically and session replay is off. The sign-in funnel is `$pageview /` →
`sign_in_clicked` → `signed_in` → `onboarding_completed` → `$pageview /stories`.
On sign-in the anonymous ID is merged into the User's id, so one person is one ID.
Never send names, emails or other personal data, and never use events to
personalize stories.

## UI

Use the existing light/dark theme tokens and Sutra primitives where they fit.
Keep source links visible, keyboard controls usable and mobile layouts intact.
Shared components belong in [Sutra](https://github.com/imsks/sutra-ui), not a local copy.
The full contribution rules live in [CONTRIBUTING.md](../CONTRIBUTING.md).