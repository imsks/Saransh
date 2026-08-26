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

All API calls go through FastAPI on `:8001` — there are no Next.js API routes.
