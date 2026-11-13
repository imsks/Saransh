# Frontend Agent

Read the current component and its test first. Actual shipped scope is in
[readme.md](../../readme.md); environment and analytics are in
[frontend/README.md](../../frontend/README.md). Use
[CONTRIBUTING.md](../../CONTRIBUTING.md) for shared rules and checks, and
[CONTEXT.md](../../CONTEXT.md) for domain language.

## Frontend-specific guidance

- Next.js 14 App Router, React 18, TypeScript, Tailwind 4, Sutra tokens/components. Do not assume React 19 features.
- Server Components are the default; put client boundaries on the smallest interactive leaf. next-auth lives at `src/app/api/auth`; call FastAPI's User endpoints only through `src/lib/server-api.ts` on the server.
- `@/` points to `src/`. Components are under `src/components`, sample stories under `src/constants`, reusable logic under `src/lib`, Jest/Testing Library tests under `tests`.
- Tailwind themes live in `src/app/globals.css`, not a tailwind.config file. Use its light/dark token names, not component-level color literals or inversion.
- Preserve the editorial landing page: compact mono labels, sharp controls, offset shadows. The planned reader surface has different rounded-card typography; do not redesign one to match the other.
- Existing layout uses 1120px content width, 32px side padding (20px below 560px), two columns above 860px and 80px section padding.
- Red expresses brand identity, ink primary actions and preferences. Topic accents are for topic text/illustrations, not the brand. Topics always have a text label.
- Source links stay visible; the green tick means an official source only. Samples must not gain invented article links or a fake live-feed claim.
- Use the exact positioning line when needed: "No noise. Just news. With proof."
- Mount theme controls on the client to avoid hydration mismatches. Load fonts through next/font and respect reduced-motion preferences.
- Use `getApiBaseUrl()` for API calls and choose explicit caching/error behavior. The current landing carousel uses constants, not the tested API-story mapper.
- Capture funnel events through `@/lib/analytics`; autocapture covers clicks and pageviews. No names/emails, session replay or analytics-driven story personalization.
- SEO helpers are in `src/lib/seo`; preserve canonical, Open Graph and JSON-LD output.
- Use semantic HTML, one H1, sensible heading order, visible focus, keyboard/tap alternatives to swipes and status announcements for async results.
- Never put a token or the internal key on the next-auth session or in a `NEXT_PUBLIC_` variable.

Do not add a local twin of a generic Sutra primitive. The existing editorial
controls are a documented design exception. Check both themes and 360px/mobile
layouts, and run the Jest, lint, typecheck and build gates in CONTRIBUTING.