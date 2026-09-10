# 10 — Deploy the frontend to Vercel and wire it to Cloud Run

**Issue**: [#40](https://github.com/imsks/Saransh/issues/40) · **Type**: HITL · **Blocked by**: 09

Read [README.md](README.md) first.

## Why

A deployed API with no site in front of it collects nothing. This is the slice that makes the
Waitlist reachable by an actual person — and it is what gives Rajniti's cross-promo section
(imsks/Rajniti#261) somewhere to send people.

## Human judgement required

Vercel account access.

## Current state

- `frontend/` — Next.js app, marketing page plus the Waitlist form
- `frontend/src/lib/api-base.ts` — resolves the API base differently for SSR and the browser. The
  SSR branch loops back through Next rewrites when `NEXT_PUBLIC_API_URL` points at localhost, and
  falls through to the public URL when it does not. **That fall-through branch has only ever run
  locally.** It is the thing most likely to misbehave on the deployed build.
- `frontend/next.config.mjs` — rewrites driven by `API_REWRITE_TARGET` / `API_URL` /
  `NEXT_PUBLIC_API_ORIGIN`
- Rajniti's frontend is on Vercel; this follows the same pattern

## Action plan

1. Deploy `frontend/` to Vercel. Root directory is `frontend`, not the repo root — the repo root is
   the Python API.
2. Set `NEXT_PUBLIC_API_URL` to the Cloud Run `/api/v1` base and `NEXT_PUBLIC_API_ORIGIN` to the
   service origin.
3. Add the resulting Vercel origin to the backend's `CORS_ORIGINS` and redeploy the API. Include
   both the production domain and, if you want working previews, the preview pattern — Vercel gives
   every deployment its own hostname, and each one is a distinct origin as far as CORS is concerned.
4. **Verify SSR against the real backend**, not just that the page renders. Check the server log or
   disable JavaScript to confirm story content arrives server-rendered rather than being filled in
   by a client fetch that happens to work.
5. Submit a real Waitlist Signup from the deployed site with the browser console open. No CORS
   errors, and the row lands in the Saransh database.
6. If the URL is not `https://saransh-app.vercel.app`, update `NEXT_PUBLIC_SARANSH_URL` in the
   Rajniti deployment and say so on imsks/Rajniti#261 — otherwise Rajniti ships a dead link.
7. Document the frontend env vars in `docs/DEPLOYMENT.md`.

## Acceptance criteria

- [ ] Frontend deployed to Vercel on a working public URL
- [ ] `NEXT_PUBLIC_API_URL` points at the Cloud Run `/api/v1` base
- [ ] The Vercel origin is in the backend's `CORS_ORIGINS` and the API has been redeployed
- [ ] A Waitlist Signup from the deployed site persists, with no CORS errors in the console
- [ ] Server-rendered story content loads — the SSR branch of `getApiBaseUrl()` confirmed against
      the real backend
- [ ] If the URL differs from `saransh-app.vercel.app`, `NEXT_PUBLIC_SARANSH_URL` updated in Rajniti
      and noted on imsks/Rajniti#261
- [ ] Frontend env vars documented in `docs/DEPLOYMENT.md`

## How to verify

```bash
SITE=https://<deployment>.vercel.app
curl -fsS $SITE | head -c 200
curl -s $SITE | grep -c 'story'          # server-rendered content present, not an empty shell
```

Then in the browser: submit the Waitlist form, confirm no CORS error in the console, and confirm
the row in the database.

## Out of scope

Custom domain, analytics, OG image tuning, and preview-deployment CORS beyond whatever you choose
to allow.
