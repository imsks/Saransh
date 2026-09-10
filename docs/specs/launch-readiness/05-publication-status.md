# 05 — Publication Status: public reads see Published only

**Issue**: [#36](https://github.com/imsks/Saransh/issues/36) · **Type**: AFK · **Blocked by**: 02

Read [README.md](README.md) first.

## Why

`ingest_story` writes every Story with `status="draft"` (`app/api/stories.py:147`). `list_stories`
(`:104`) applies a status filter only when a caller passes one, and the endpoint requires no
authentication. So the public feed currently serves every unreviewed Draft an ingestion Agent has
produced — including whatever it got wrong — to anyone who can reach the API.

Saransh's promise is verified, attributed news. Serving unreviewed model output under that promise
is the single worst defect in this epic.

There is also no way to move a Story out of Draft. The lifecycle exists in the schema
(`status`, `published_at`) and nothing implements it.

## Current state

- `app/api/stories.py:103-124` — `list_stories`, optional `status` query param, no auth
- `app/api/stories.py:126-133` — `get_story`, no auth, no status check
- `app/api/stories.py:25` — `_require_api_key`, currently only attached to the POST
- `app/db/models.py` — `Story.status` defaults to `"draft"`; `published_at` is nullable and never set

## What changes

The read surface splits by caller, not by route. Public callers see Published Stories only. A
caller presenting a valid `X-API-Key` sees everything and may filter by status explicitly.

A Draft requested by id returns **404 to a public caller, not 403** — a 403 confirms the Story
exists, which is a slower leak of the same information.

The `?status=` parameter needs care: a public caller passing `?status=draft` must not receive
Drafts. Ignore or reject the parameter for unauthenticated callers rather than passing it through
to the query. This is the easy bug to write here.

Publication gets an endpoint: `PATCH /api/v1/stories/{id}/publish`, API key required, sets `status`
and stamps `published_at`. Re-publishing is a no-op returning the Story unchanged with its original
`published_at` intact — a retried call must not rewrite history.

## Action plan

1. Add an optional-authentication dependency: resolves to "authenticated" when a valid key is
   present, "public" otherwise, without raising for the public case. `_require_api_key` keeps its
   current raising behaviour for writes.
2. `list_stories` — when public, force `status == "published"` regardless of the query parameter.
   When authenticated, the parameter behaves as it does today.
3. `get_story` — when public and the Story is not Published, 404.
4. Add `PATCH /stories/{id}/publish`, key required: 404 on unknown id; sets `status="published"` and
   `published_at=now()` on a Draft; returns an already-Published Story untouched.
5. Check the frontend still renders. `frontend/src/lib/stories.ts` reads the public feed, which is
   now empty unless something is Published — if the local flow relied on Drafts being visible, fix
   the fixture or seed rather than weakening the filter.
6. Tests for every branch below.

## Acceptance criteria

- [ ] Unauthenticated list returns Published Stories only
- [ ] `?status=draft` from an unauthenticated caller does not leak Drafts
- [ ] Unauthenticated detail request for a Draft returns 404
- [ ] With a valid `X-API-Key`, list and detail return any status and `?status=` filters as before
- [ ] `PATCH /api/v1/stories/{id}/publish` requires the key, sets `status` and `published_at`,
      returns the updated Story
- [ ] Re-publishing returns the Story and leaves the original `published_at` intact
- [ ] Publishing an unknown id returns 404
- [ ] The frontend still renders against a published-only feed
- [ ] `pytest tests/ -q` green

## How to verify

```bash
curl -s localhost:8001/api/v1/stories | jq 'map(.status) | unique'          # ["published"]
curl -s "localhost:8001/api/v1/stories?status=draft" | jq 'length'          # 0
curl -s -H "X-API-Key: $SARANSH_INGEST_API_KEY" \
     "localhost:8001/api/v1/stories?status=draft" | jq 'length'             # > 0
curl -s -o /dev/null -w '%{http_code}\n' localhost:8001/api/v1/stories/<draft-id>   # 404
curl -X PATCH -H "X-API-Key: $SARANSH_INGEST_API_KEY" \
     localhost:8001/api/v1/stories/<draft-id>/publish | jq '.status, .published_at'
```

## Out of scope

An admin UI for reviewing Drafts, an unpublish transition, and scheduled publishing. The API call
is the whole of the mechanism for now.
