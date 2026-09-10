# 04 — Make Ingest idempotent

**Issue**: [#35](https://github.com/imsks/Saransh/issues/35) · **Type**: AFK · **Blocked by**: 03

Read [README.md](README.md) first.

## Why

`ingest_story` in `app/api/stories.py:141` constructs a new `Story` on every call. There is no
uniqueness anywhere that would stop it. `uq_story_source_url` covers `(story_id, url)` — and since
each insert generates a fresh `story_id`, that constraint can never fire across two separate
requests. It only prevents listing the same URL twice within one payload.

So an ingestion Agent whose request times out after the commit, and retries — the ordinary
behaviour of every HTTP client ever written — produces two identical Stories. Curation then has to
clean up after a problem the API created.

## Current state

- `app/api/stories.py:135-141` — `POST /stories`, `status_code=201`, always inserts
- `app/db/models.py` — `Source.url` is a plain non-unique `Text` column
- The endpoint wraps everything in a broad `except Exception` that rolls back and returns 500

## What changes

Source URL becomes the natural key: a given article URL belongs to exactly one Story. A unique
index on `sources.url` enforces it, and the endpoint checks incoming Sources before inserting. A
replay returns the existing Story with **200**; a genuinely new Story still returns **201**, so the
caller can tell what happened from the status code alone.

**Partial overlap** — a payload with one known URL and two new ones — resolves to the existing
Story rather than creating a duplicate. It is the same event reported with more Sources. Whether to
attach the new Sources to that Story or ignore them is a real choice: attach them, since the
information is strictly better, but say so in the docstring so the next reader doesn't have to
infer it from the code.

**The pre-check is not enough.** Two concurrent identical ingests can both pass the check and both
attempt the insert. Catch the `IntegrityError`, roll back, re-read, and return the winner. A
check-then-act without the catch is a race that shows up only under load, which is to say in
production.

## Action plan

1. Alembic revision adding a unique index on `sources.url`. The migration will fail if duplicates
   already exist, so the revision must say — in a comment at the top — how to find and resolve them
   (`SELECT url FROM sources GROUP BY url HAVING count(*) > 1`).
2. Add a lookup for existing Stories by incoming source URLs.
3. Rework `ingest_story`: if any incoming URL is known, return that Story with 200, attaching any
   genuinely new Sources. Otherwise insert and return 201.
4. Narrow the exception handling so `IntegrityError` on the URL index is handled as "someone else
   won the race, return theirs" and not as a 500. Everything else still 500s.
5. Document the resolution rules in the endpoint docstring — this is the kind of behaviour people
   guess wrong about.
6. Tests: replay returns 200 and writes nothing; new Story returns 201; partial overlap resolves to
   the existing Story; the integrity-error fallback path returns the winner rather than 500.

## Acceptance criteria

- [ ] Alembic revision adds a unique index on `sources.url`, with the duplicate-resolution query in
      a comment
- [ ] Replaying an ingest returns 200 with the existing Story and creates no new Story
- [ ] A genuinely new Story still returns 201
- [ ] Partial overlap resolves to the existing Story; the rule is stated in the docstring
- [ ] Concurrent identical ingests produce exactly one Story; the loser catches `IntegrityError`,
      rolls back and returns the winner
- [ ] Tests cover replay, partial overlap, new story, and the race fallback
- [ ] `pytest tests/ -q` green

## How to verify

```bash
# same payload twice: first 201, second 200, and only one row
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:8001/api/v1/stories \
  -H "X-API-Key: $SARANSH_INGEST_API_KEY" -H 'Content-Type: application/json' -d @story.json
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:8001/api/v1/stories \
  -H "X-API-Key: $SARANSH_INGEST_API_KEY" -H 'Content-Type: application/json' -d @story.json
```

## Out of scope

Semantic deduplication — two outlets covering one event under different URLs are still two Stories
here. Merging those is Curation's job, not the API's.
