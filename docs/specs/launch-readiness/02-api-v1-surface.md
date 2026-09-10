# 02 — Unify the API surface under /api/v1

**Issue**: [#32](https://github.com/imsks/Saransh/issues/32) · **Type**: AFK · **Blocked by**: none · **Blocks**: 05

Read [README.md](README.md) first.

## Why

One service, two URL conventions. `main.py:35` mounts the versioned router at `/api/v1`, and
`main.py:37` mounts the stories router at `/api`. So the waitlist is at `/api/v1/waitlist` while
Stories are at `/api/stories`, and every caller — the frontend, the ingestion Agent, anyone reading
the docs — has to remember which is which. It also means a future `/api/v2` would only cover half
the surface.

The split has leaked into the frontend: `frontend/src/lib/api-base.ts` carries a whole second
function, `getStoriesApiBaseUrl()`, that exists purely to build the unversioned path, duplicating
the SSR/browser branching logic in `getApiBaseUrl()`. Two copies of that logic is two places for it
to drift.

## Current state

- `main.py:35-37` — two `include_router` calls with different prefixes
- `app/api/__init__.py` — composes `common_router` and `waitlist_router` only; stories are not part
  of the versioned router
- `app/api/stories.py:103,126,135` — routes declared as `/stories`, `/stories/{story_id}`
- `frontend/next.config.mjs` — three rewrite entries: `/api/v1/:path*`, `/api/stories/:path*`,
  `/api/stories`
- `frontend/src/lib/api-base.ts` — `getStoriesApiBaseUrl()` and `getApiBaseUrl()`, near-duplicate
  SSR/browser resolution
- `frontend/src/lib/stories.ts` and `stories.test.ts` — the callers
- `tests/test_api_surface.py` — asserts the mounted paths

## What changes

Stories move into the versioned router alongside the waitlist. `/api/stories` keeps working for one
release as a deprecated alias — same handlers, same responses, plus a `Deprecation` header naming
the replacement path — so nothing has to be redeployed in lockstep.

On the frontend, `getStoriesApiBaseUrl()` folds into `getApiBaseUrl()`. There is only one base URL
once the surface is unified.

## Action plan

1. Include `stories_router` in `app/api/__init__.py` so it is served under `/api/v1`.
2. In `main.py`, keep the second mount as an explicit alias. Do not duplicate the route
   definitions — mount the same router object at `/api` and attach a small middleware or router
   dependency that sets a `Deprecation` response header on those paths only. A one-line comment
   should say when the alias goes away.
3. Add the versioned rewrite for stories in `frontend/next.config.mjs`; leave the legacy story
   rewrites in place with a comment tying them to the alias's removal.
4. Delete `getStoriesApiBaseUrl()` and repoint `frontend/src/lib/stories.ts` at `getApiBaseUrl()`.
   Update `api-base.test.ts` and `stories.test.ts`.
5. Note the alias's removal release in `readme.md` so it does not become permanent by neglect.
6. Tests: every story route reachable at both paths with identical bodies; the alias sets the
   header and the canonical path does not.

## Acceptance criteria

- [ ] `GET/POST /api/v1/stories` and `GET /api/v1/stories/{id}` serve the story endpoints
- [ ] `/api/stories*` still works, returns identical responses, and sets a `Deprecation` header
- [ ] `next.config.mjs` rewrites cover the versioned path; legacy entries marked for removal
- [ ] `getStoriesApiBaseUrl()` is gone and its callers use `getApiBaseUrl()`
- [ ] `api-base.test.ts` and `stories.test.ts` updated and passing
- [ ] Backend tests assert both paths and the deprecation header
- [ ] `readme.md` records when the alias is removed

## How to verify

```bash
make up
curl -fsS http://localhost:8001/api/v1/stories | head -c 200
curl -si  http://localhost:8001/api/stories | grep -i deprecation
cd frontend && npm test
```

## Out of scope

Changing what the story endpoints return — the published-only filter is slice 05, and it is easier
to review once the paths have settled.
