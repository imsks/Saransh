---
name: story-ingest
description: "Ingest verified Indian news as Saransh Stories. Use when explicitly running the scheduled Stopgap Routine or /story-ingest."
disable-model-invocation: true
---

# Story ingest

Routine version: 2026-11-13

This Stopgap Routine publishes immediately, without review, and may use a publisher's
image. Retire it when the review screen and publish action are available. Run it only
when explicitly invoked, including by the scheduled `/story-ingest` prompt.

## Before starting

- Run from the Saransh repository root. Read [`app/onboarding.py`](../../../app/onboarding.py)
  for `INDIAN_STATES` and `LIVE_TOPICS`; stop if they cannot be read.
- Require `SARANSH_API_BASE` (an http(s) origin without a path) and
  `SARANSH_INGEST_API_KEY` from the environment. Stop if either is missing or the
  origin is invalid; do not guess.
- Never print, log, or commit the key. Send it only as `X-API-Key` to the configured
  API origin, never to an article or image URL. Do not enable shell tracing or verbose
  HTTP logging.
- Create at most 10 Stories per run. Count confirmed creations and requests whose
  outcome is unknown against that limit; only 201 responses are confirmed successes.

## Find and prepare Stories

1. Load recent published Stories with
   `GET $SARANSH_API_BASE/api/v1/stories?limit=100&offset=0`. Page while `created_at`
   is within the last 48 hours, stopping at offset 300. Collect every `source_url`
   and `title_en`. If a page fails or cannot be interpreted, stop and report the
   failure instead of ingesting without a duplicate check.
2. Find up to 10 distinct events from articles published in the last 36 hours. Open
   each article, confirm it loads and covers the event, and use its canonical article
   URL as `source_url`. Skip events whose URL or headline is already in the recent
   Stories. At most two Stories may cover the same event, and only from different
   outlets. Do not ingest Entertainment or Sports.
3. Assign exactly one tier:
   - `national`: Union government, Parliament, Supreme Court, RBI, another central
     body, or an event affecting more than one state.
   - `state`: mainly about one Indian state or UT in `INDIAN_STATES`.
   - `international`: outside India and the article names India, an Indian entity,
     Indians abroad, or a direct effect on India.
   There is no district or city tier; skip an event if its state is not in the list.
4. Choose a real, directly loadable image for the event: the article lead image or
   an official/agency photo. Confirm the absolute http(s) URL returns a jpg, jpeg,
   png, or webp image. Do not use a homepage, article URL, logo, tracking pixel,
   blocked hotlink, invented URL, or unrelated stock photo. Skip the event if no
   valid image is available.
5. Build one JSON object per Story, replacing every placeholder below with verified
   values; never ingest the example itself:

```json
{
  "title_en": "Factual headline",
  "summary_en": "What happened, who said it, and what changes.",
  "image_url": "https://example.com/cover.jpg",
  "source_url": "https://example.com/article",
  "source_label": "Outlet name",
  "category": "politics",
  "tier": "state",
  "state": "Maharashtra"
}
```

   All fields except `state` must be non-blank. `source_url` must be the verified
   article used for the summary, and `source_label` its outlet; skip the event if
   either is unavailable. Use a factual headline and a summary of at most 60 words
   (a word is anything between spaces); attribute claims and avoid advice,
   predictions, and editorial adjectives. Count the words before sending.
   `category` must be a `LIVE_TOPICS` key. For `state` tier, use the exact full name
   from `INDIAN_STATES`; for `national` or `international`, set `state` to null.
   Never send abbreviations, cities, districts, `id`, `status`, or `created_at`.

## Ingest and report

Send each object separately to `POST $SARANSH_API_BASE/api/v1/stories`, with
`X-API-Key` and `Content-Type: application/json` headers.

- **201:** Count a confirmed success and add its URL and headline to the skip list.
- **401:** Stop the run; the key is missing or invalid.
- **422:** Correct the payload and retry once. If it is rejected again, skip it.
- **5xx, or a timeout/transport failure after a request may have been sent:** Do not
  retry. The Story may already exist; count it against the run limit and report the
  outcome as unknown.
- **Any other error:** Skip that Story and report the error.

The first line of the report must be `Routine version: 2026-11-13`. Then report the
number of confirmed 201s; each success's id, title, category, tier, state,
source_label, and source_url; and each skipped or uncertain Story's title and reason.
Report a premature stop explicitly. Never include the API key or full article text.
