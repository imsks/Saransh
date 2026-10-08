# Story ingest routine

A [Claude Code routine](https://docs.claude.com/en/docs/claude-code) that ingests real Indian
news into Saransh on a schedule. Each run creates up to **10 new Stories** via
`POST /api/v1/stories`; scheduling the same prompt **5x a day** gives the 50-a-day cadence.

No API or app-code change is required — the routine only calls the existing endpoint.

> **This is a stopgap, not the Saransh pipeline.** The planned pipeline reads approved RSS, licensed
> and official sources, drafts with local AI, and publishes nothing until a person approves it
> (`docs/PROJECT_STATE.md`, section 14.5). This routine does none of that. Its Stories are published
> the moment they are ingested, with no human review; it opens and reads article pages; and it may
> use a publisher's own image. Those are known breaches of the product rules, accepted on
> 8 Oct 2026 so the landing page stays populated, and the routine is switched off when the review
> screen and publish action exist, before the pilot starts.
>
> **Changing this file does not change a routine that is already scheduled.** After editing the
> prompt below, replace the prompt in the scheduled routine too. Last prompt change: 8 Oct 2026
> (no "Regional" tier, no district, International stories need an India link, word limits stated).

## What the ingest API accepts

One [`StoryIn`](../app/schemas/stories.py) per request (the endpoint rejects an array). The write is
guarded by the `X-API-Key` header, compared to `SARANSH_INGEST_API_KEY`
([`app/api/dependencies.py`](../app/api/dependencies.py)). Every ingested Story is stored as
`published` and is readable immediately — review the payload before sending it.

Required, non-blank:

- `title_en`, `title_hi`, `summary_en`, `summary_hi`, `category`
- `image_url`: the cover photo, an absolute `http`/`https` image URL
- `sources`: at least one `{ outlet, url, source_type? }`

Optional: `source_url`, `state` (omit or `null`; never send `""`). The API still accepts
`district`, but Saransh no longer has a district tier — do not send it.

`source_url` is the **citation link** — the single canonical article the summary was extracted from.
It is stored on the Story itself, not derived from `sources[0]`, so a Story can cite corroborating
outlets in `sources` while still pointing at the one article it was written from. The column is
nullable because Stories ingested before 2026-09-28 predate it; the routine below always sends it.

Never send `id`, `status`, or `created_at` — the server owns those. A Story is published the
moment it is ingested, so `created_at` is the only time of record; the `published_at` column was
dropped on 2026-10-01 and is no longer accepted or returned.

Database limits the request schema does not enforce ([`app/db/models.py`](../app/db/models.py)):

| Field | Limit |
|-------|-------|
| `category` | ≤ 50 chars |
| `state` | ≤ 100 chars |
| `outlet` | ≤ 150 chars |
| `source_type` | ≤ 30 chars |
| `url`, `image_url`, `source_url` | absolute `http`/`https` |

The landing carousel ([`frontend/src/lib/stories.ts`](../frontend/src/lib/stories.ts)) shows the
Story's `image_url` as the card image and its first source's outlet name as the credit and source
line. `category` is not shown on the card; it only picks the card's accent colour, by keyword
(education, health, jobs or transport words, otherwise civic). So a tier name in `category`
("National", "State", "International") always gets the civic accent. Saransh's planned schema has a
separate tier and one topic per Story; until it exists, this routine sends the tier in `category`.

`state` is geography only: the Indian state or union territory a State-tier Story is about, and
`null` for National and International Stories.

The card's outlet badge is a link to `source_url`, falling back to the first `sources[].url` for
Stories that predate the field. A wrong citation link is therefore visible to readers — verify the
URL loads before you send it.

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
   Collect every source_url, every sources[].url, and every title_en. Skip any event whose URL or headline is already there.

2. Find 10 distinct events from the last 36 hours. Open each article and confirm the page is about that event and returns successfully. Use the canonical article URL, not a homepage, app link, or tracker. Keep that URL — it is the citation link you send as source_url, and it is the one article you write the summary from.
   Mix, within this run:
   - 5 National (category "National", state null): central government, Parliament, Supreme Court, RBI and other central bodies, or anything affecting more than one state
   - 3 State (category "State", state = the Indian state or union territory the story is about) — different states
   - 2 International (category "International", state null): the event happens outside India AND the article names India, an Indian entity, Indians abroad, or a direct effect on India. Skip any international story with no India link.
   If a tier is short, fill from National. Do not ingest entertainment or sports stories.
   At most two Stories may cover the same event, and only when they cite different outlets. Prefer a second outlet as another source on the same Story instead.

3. For each event, choose a cover photo (image_url):
   - Use a real, directly-loadable image URL for that event — the outlet's article lead image, or an official/agency (PTI, PIB, ministry, government) photo for the story.
   - It must be an absolute http(s) URL that returns an image (jpg, jpeg, png, or webp). Open it and confirm it loads. Do not use a homepage, an article URL, a logo, a tracking pixel, or a hotlink that blocks embedding.
   - Never invent an image URL and never reuse a stock photo unrelated to the event. If you cannot find a valid image for an event, skip that event.

4. For each event, build one JSON object. One object per request — the API rejects an array.

   {
     "title_en": "factual headline, no opinion",
     "title_hi": "the same headline in Hindi",
     "summary_en": "At most 60 words. What happened, who said it, what changes. Attribute claims (per PTI, the ministry said). No advice, no prediction, no adjectives that editorialize.",
     "summary_hi": "the same summary in Hindi, at most 70 words, not a transliteration",
     "image_url": "https://absolute-url-to-a-real-cover-photo.jpg",
     "source_url": "https://absolute-url-of-the-article-you-summarised",
     "category": "National | State | International",
     "state": "Indian state or union territory for a State story, otherwise null",
     "sources": [
       {
         "outlet": "outlet name, max 150 characters",
         "url": "https://absolute-article-url",
         "source_type": "news or official"
       }
     ]
   }

   Rules:
   - title_en, title_hi, summary_en, summary_hi, image_url, category are required and non-blank.
   - image_url must be an absolute http(s) URL to a real image for this event that you confirmed loads. Skip the story if you cannot find one.
   - source_url is the citation link: the absolute http(s) URL of the one article you summarised, the same URL you opened and confirmed in step 2. Always send it. Never send "" — omit it only if you somehow have no article URL, which should not happen. It must also appear in sources as the entry for that outlet.
   - Word limits are hard: summary_en at most 60 words, summary_hi at most 70 words. A word is anything between spaces. Count before you send; if a summary is over, shorten it.
   - category is exactly one of National, State, International.
   - state max 100 characters. Null for National and International. Never send "". Never send district.
   - At least one source. url must be absolute http(s). outlet required. source_type is "news" or "official" (max 30 characters).
   - Do not send id, status, or created_at. The server stores status "published" and stamps created_at, which is the only time a reader sees. There is no published_at.
   - Hindi must be real Hindi. If you cannot write an accurate Hindi headline and summary, skip that story.

5. Ingest one Story at a time:
   POST $SARANSH_API_BASE/api/v1/stories
   Header: X-API-Key: $SARANSH_INGEST_API_KEY
   Header: Content-Type: application/json
   Body: the single object.

   - 201: count it. Record id and title_en. Add its URLs to the skip list.
   - 401: stop the run. The key is missing or wrong.
   - 422: fix that payload once (blank field, bad URL, bad image_url, bad source_url, empty sources) and POST again. If it fails again, skip it.
   - 500 or a timeout after the request was sent: do not retry. The row may already exist. Skip it and say so.
   - Any other error: skip that story and continue.

6. When you finish, report only:
   - how many 201s (target 10)
   - for each success: id, title_en, category, state, source_url
   - for each skip: title_en and the reason (duplicate, unverified URL, no valid image, 422, 500, weak Hindi)
   Do not include the API key or full article text.
```
