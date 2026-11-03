# Story ingest routine

A [Claude Code routine](https://docs.claude.com/en/docs/claude-code) that ingests real Indian
news into Saransh on a schedule. Each run creates up to **10 new Stories** via
`POST /api/v1/stories`; scheduling the same prompt **5x a day** gives the 50-a-day cadence.

No API or app-code change is required — the routine only calls the existing endpoint.

> **STOPGAP**: This routine is a temporary fallback while the review screen and publish action do not yet exist. It publishes immediately, may use a publisher's own image, and is retired once the pipeline and publish action are in place.
>
> **Changing this file does not change a routine that is already scheduled.** After editing the
> prompt below, replace the prompt in the scheduled routine too. Last prompt change: 18 Oct 2026
> (English-only; one citation link and its outlet label; no `sources` list).

## What the ingest API accepts

One [`StoryIn`](../app/schemas/stories.py) per request (the endpoint rejects an array). The write is
guarded by the `X-API-Key` header, compared to `SARANSH_INGEST_API_KEY`
([`app/api/dependencies.py`](../app/api/dependencies.py)). Every ingested Story is stored as
`published` and is readable immediately — review the payload before sending it.

Required, non-blank:

- `title_en`, `summary_en`, `category`
- `image_url`: the cover photo, an absolute `http`/`https` image URL

Optional: `source_url`, `source_label`, `state` (omit or `null`; never send `""`). `state` is set for State stories only; leave it `null` for National and International stories.

`source_url` is the **citation link** — the single canonical article the summary was extracted from —
and `source_label` is that outlet's name. The column is nullable because Stories ingested before
2026-09-28 predate it; the routine below always sends both. Fields the API no longer stores
(`title_hi`, `summary_hi`, `sources`, `district`, `published_at`) are ignored if sent.

Never send `id`, `status`, or `created_at` — the server owns those. A Story is published the
moment it is ingested, so `created_at` is the only time of record; the `published_at` column was
dropped on 2026-10-01 and is no longer accepted or returned.

Database limits the request schema does not enforce ([`app/db/models.py`](../app/db/models.py)):

| Field                            | Limit                   |
| -------------------------------- | ----------------------- |
| `category`                       | ≤ 50 chars              |
| `state`                          | ≤ 100 chars             |
| `image_url`, `source_url`        | absolute `http`/`https` |

The tested API-story adapter ([`frontend/src/lib/stories.ts`](../frontend/src/lib/stories.ts)) maps
`image_url` to the card image and `source_label` to its credit and source line.
The landing carousel currently uses static samples, not this adapter or the API feed.
`category` holds the story's topic key, not a tier string. Old tier strings are invalid for
the live topic set. The card topic label is built from the current topic keys: `politics | civic | education | crime | business`.

`state` is geography only: the Indian state or union territory a State-tier Story is about, and
`null` for National and International Stories. There is no obsolete location field beyond `state`.

The adapter links the card to `source_url`. Verify the citation URL loads before sending it.

Ingest is **not idempotent**: a retry after a timeout can
insert a duplicate. The routine reads recent Stories first and never retries a POST that may have
already committed.

## Routine setup

Set two variables in the routine environment (the prompt reads them and must never print the key):

- `SARANSH_API_BASE` — origin only, no `/api/v1` (the Cloud Run URL, or `http://localhost:8001` for
  a local trial)
- `SARANSH_INGEST_API_KEY` — the ingest key

Schedule the prompt five times a day (for example 07:00, 10:00, 13:00, 16:00, 19:00 IST). Each run
ingests at most 10 new Stories.

## Prompt

```text
You ingest Indian news into Saransh. This run creates at most 10 new Stories, each from a real article published in the last 36 hours. Stop when 10 succeed, or sooner if you cannot find 10 new, sourced events. Never invent a story, a quote, a number, or a URL.

Environment (stop immediately if either is missing; do not guess):
- SARANSH_API_BASE — origin only, e.g. https://your-service.run.app
- SARANSH_INGEST_API_KEY — sent only as the X-API-Key header

Never print, log, or commit the API key.

1. Load recent Stories so you do not duplicate them.
   GET $SARANSH_API_BASE/api/v1/stories?limit=100&offset=0
   Page with offset while created_at is within the last 48 hours (max offset 300).
   Collect every source_url and every title_en. Skip any event whose URL or headline is already there.

2. Find 10 distinct events from the last 36 hours. Open each article and confirm the page is about that event and returns successfully. Use the canonical article URL, not a homepage, app link, or tracker. Keep that URL — it is the citation link you send as source_url, and it is the one article you write the summary from.
   Daily mix, within this run:
   - National: stories about the Union government, Parliament, Supreme Court, RBI or other central bodies, or anything affecting more than one state
   - State: the story is mainly about one Indian state or UT, with state set to that place
   - International: only if the event happens outside India and the article names India, an Indian entity, Indians abroad, or a direct effect on India; drop the rest
   Do not ingest entertainment or sports stories. At most two Stories may cover the same event, and only when they cite different outlets.

3. For each event, choose a cover photo (image_url):
   - Use a real, directly-loadable image URL for that event — the outlet's article lead image, or an official/agency (PTI, PIB, ministry, government) photo for the story.
   - It must be an absolute http(s) URL that returns an image (jpg, jpeg, png, or webp). Open it and confirm it loads. Do not use a homepage, an article URL, a logo, a tracking pixel, or a hotlink that blocks embedding.
   - Never invent an image URL and never reuse a stock photo unrelated to the event. If you cannot find a valid image for an event, skip that event.

4. For each event, build one JSON object. One object per request — the API rejects an array.

   {
     "title_en": "factual headline, no opinion",
     "summary_en": "At most 60 words. What happened, who said it, what changes. Attribute claims (per PTI, the ministry said). No advice, no prediction, no adjectives that editorialize.",
     "image_url": "https://absolute-url-to-a-real-cover-photo.jpg",
     "source_url": "https://absolute-url-of-the-article-you-summarised",
     "source_label": "outlet name of that article",
     "category": "politics",
     "state": "Maharashtra"
   }

   Rules:
   - title_en, summary_en, image_url, category are required and non-blank.
   - image_url must be an absolute http(s) URL to a real image for this event that you confirmed loads. Skip the story if you cannot find one.
   - source_url is the citation link: the absolute http(s) URL of the one article you summarised, the same URL you opened and confirmed in step 2. Always send it, with source_label set to that outlet's name. Never send "".
   - Word limits are hard: summary_en at most 60 words. A word is anything between spaces. Count before you send; if a summary is over, shorten it.
   - category is exactly one of politics | civic | education | crime | business.
   - state max 100 characters. Set it to the Indian state or union territory for a State story; otherwise null. Never send "". Never send any obsolete location field.
   - Do not send id, status, or created_at. The server stores status "published" and stamps created_at, which is the only time a reader sees. There is no published_at.
   - Skip Entertainment and Sports stories; they are not in the live topic set.

5. Ingest one Story at a time:
   POST $SARANSH_API_BASE/api/v1/stories
   Header: X-API-Key: $SARANSH_INGEST_API_KEY
   Header: Content-Type: application/json
   Body: the single object.

   - 201: count it. Record id and title_en. Add its URLs to the skip list.
   - 401: stop the run. The key is missing or wrong.
   - 422: fix that payload once (blank field, bad URL, bad image_url, bad source_url) and POST again. If it fails again, skip it.
   - 500 or a timeout after the request was sent: do not retry. The row may already exist. Skip it and say so.
   - Any other error: skip that story and continue.

6. When you finish, report only:
   - how many 201s (target 10)
   - for each success: id, title_en, category, state, source_url
   - for each skip: title_en and the reason (duplicate, unverified URL, no valid image, 422, 500)
   Do not include the API key or full article text.
```
