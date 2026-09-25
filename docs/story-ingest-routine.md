# Story ingest routine

A [Claude Code routine](https://docs.claude.com/en/docs/claude-code) that ingests real Indian
news into Saransh on a schedule. Each run creates up to **10 new Stories** via
`POST /api/v1/stories`; scheduling the same prompt **5x a day** gives the 50-a-day cadence.

No API or app-code change is required — the routine only calls the existing endpoint.

## What the ingest API accepts

One [`StoryIn`](../app/schemas/stories.py) per request (the endpoint rejects an array). The write is
guarded by the `X-API-Key` header, compared to `SARANSH_INGEST_API_KEY`
([`app/api/dependencies.py`](../app/api/dependencies.py)). Every ingested Story is stored as
`published` and is readable immediately — review the payload before sending it.

Required, non-blank:

- `title_en`, `title_hi`, `summary_en`, `summary_hi`, `category`
- `image_url`: the cover photo, an absolute `http`/`https` image URL
- `sources`: at least one `{ outlet, url, source_type? }`

Optional: `state`, `district` (omit or `null`; never send `""`).

Never send `id`, `status`, `created_at`, or `published_at` — the server owns those.

Database limits the request schema does not enforce ([`app/db/models.py`](../app/db/models.py)):

| Field | Limit |
|-------|-------|
| `category` | ≤ 50 chars |
| `state`, `district` | ≤ 100 chars |
| `outlet` | ≤ 150 chars |
| `source_type` | ≤ 30 chars |
| `url`, `image_url` | absolute `http`/`https` |

The landing carousel ([`frontend/src/lib/stories.ts`](../frontend/src/lib/stories.ts)) renders the
label as `category · state · district` and picks the card image from `category` alone
(`national`/`parliament` → national, `road`/`infrastructure` → road, else civic). So keep
`category` a single word and put geography in `state` / `district`. Example rendering as
"State · Uttar Pradesh · Barabanki": `category: "State"`, `state: "Uttar Pradesh"`,
`district: "Barabanki"`.

Ingest is **not idempotent**
([04-ingest-dedupe.md](specs/launch-readiness/04-ingest-dedupe.md)): a retry after a timeout can
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
   Collect every sources[].url and every title_en. Skip any event whose URL or headline is already there.

2. Find 10 distinct events from the last 36 hours. Open each article and confirm the page is about that event and returns successfully. Use the canonical article URL, not a homepage, app link, or tracker.
   Mix, within this run:
   - at least 4 National (category "National"; set state only when a body belongs in the label, e.g. state "Parliament")
   - at least 3 State (category "State", state = Indian state name, district null) — different states
   - at least 2 Regional (category "Regional", state and district both set)
   - at least 1 whose category is "Infrastructure" when a real infrastructure story exists (this picks the road image)
   At most two Stories may cover the same event, and only when they cite different outlets. Prefer a second outlet as another source on the same Story instead.

3. For each event, choose a cover photo (image_url):
   - Use a real, directly-loadable image URL for that event — the outlet's article lead image, or an official/agency (PTI, PIB, ministry, government) photo for the story.
   - It must be an absolute http(s) URL that returns an image (jpg, jpeg, png, or webp). Open it and confirm it loads. Do not use a homepage, an article URL, a logo, a tracking pixel, or a hotlink that blocks embedding.
   - Never invent an image URL and never reuse a stock photo unrelated to the event. If you cannot find a valid image for an event, skip that event.

4. For each event, build one JSON object. One object per request — the API rejects an array.

   {
     "title_en": "factual headline, no opinion",
     "title_hi": "the same headline in Hindi",
     "summary_en": "2 to 4 sentences. What happened, who said it, what changes. Attribute claims (per PTI, the ministry said). No advice, no prediction, no adjectives that editorialize.",
     "summary_hi": "the same summary in Hindi, not a transliteration",
     "image_url": "https://absolute-url-to-a-real-cover-photo.jpg",
     "category": "National | State | Regional | Infrastructure",
     "state": "Indian state, or Parliament, or null",
     "district": "district name or null",
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
   - category max 50 characters. Do not put " · " inside category; the site appends state and district itself.
   - state max 100, district max 100. Omit or null when unknown. Never send "".
   - At least one source. url must be absolute http(s). outlet required. source_type is "news" or "official" (max 30 characters).
   - Do not send id, status, created_at, or published_at. The server stores status "draft".
   - Hindi must be real Hindi. If you cannot write an accurate Hindi headline and summary, skip that story.

5. Ingest one Story at a time:
   POST $SARANSH_API_BASE/api/v1/stories
   Header: X-API-Key: $SARANSH_INGEST_API_KEY
   Header: Content-Type: application/json
   Body: the single object.

   - 201: count it. Record id and title_en. Add its URLs to the skip list.
   - 401: stop the run. The key is missing or wrong.
   - 422: fix that payload once (blank field, bad URL, bad image_url, empty sources) and POST again. If it fails again, skip it.
   - 500 or a timeout after the request was sent: do not retry. The row may already exist. Skip it and say so.
   - Any other error: skip that story and continue.

6. When you finish, report only:
   - how many 201s (target 10)
   - for each success: id, title_en, category, state, district
   - for each skip: title_en and the reason (duplicate, unverified URL, no valid image, 422, 500, weak Hindi)
   Do not include the API key or full article text.
```
