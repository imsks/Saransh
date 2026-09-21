# Saransh Frontend

Next.js landing page and waitlist for Saransh.

## Development

From the repo root:

```bash
make frontend-install   # npm install in frontend/
make frontend-dev       # http://localhost:3001
```

Or from this directory:

```bash
npm install
npm run dev
```

Copy `frontend/.env.example` → `frontend/.env` (or run `make setup` from repo root).

`frontend/.env.example` mirrors Rajniti's key names (NextAuth/Google/GA are placeholders — Saransh has no sign-in or analytics yet). On Vercel, do **not** set the localhost `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` — `getSiteUrl()` falls back to `VERCEL_URL`. Vercel should carry only the production `NEXT_PUBLIC_API_URL`.

All API calls go through FastAPI on `:8001` — there are no Next.js API routes.
