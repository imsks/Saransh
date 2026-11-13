# Story ingest routine

The shared [`story-ingest` skill](../.claude/skills/story-ingest/SKILL.md) is the
single source of the Stopgap Routine's editorial rules, ingest procedure, error
handling, and report format.

> **STOPGAP:** Stories are published immediately without review and may use a
> publisher's image. Retire this routine when the review screen and publish action
> are available.

## Setup and scheduling

Run Claude Code from a Saransh checkout containing the skill. Configure Claude
authentication and the least-privilege permissions needed to read the repository,
search and open articles and images, and call the ingest API. Do not use `--bare`,
which skips project-skill discovery.

Provide these variables securely to the scheduled process:

- `SARANSH_API_BASE`: the API origin only, without `/api/v1` (for example
  `http://localhost:8001` for an isolated local trial).
- `SARANSH_INGEST_API_KEY`: the API key. Never print it or include it in a report.

Invoke the skill explicitly from the repository root:

```sh
claude -p "/story-ingest"
```

Schedule this command five times a day (for example 07:00, 10:00, 13:00, 16:00,
19:00 IST). Each run can create at most 10 Stories. There is no dry-run mode:
verify the setup against an isolated test API and test key, not production.

An existing schedule that contains the old pasted prompt **does not change
automatically**. Replace that prompt with `/story-ingest` and ensure the scheduler's
checkout includes the skill. On subsequent changes, update the checkout and verify
the first line of the next report matches the routine version in the skill. Do not
re-copy the workflow into the scheduled prompt.

## API context

The skill sends one [`StoryIn`](../app/schemas/stories.py) per
`POST /api/v1/stories`, authenticated by `X-API-Key`. The endpoint publishes each
accepted Story immediately. A valid `tier` is required on new ingests; the
[`Story` model](../app/db/models.py) keeps it nullable for older Stories.

The API currently permits optional `source_url`, `source_label`, and `state`; the
skill applies stricter editorial rules and uses `INDIAN_STATES` and `LIVE_TOPICS`
from [`app/onboarding.py`](../app/onboarding.py). The API does not enforce all of
those rules. Ingest is not idempotent, so a request with an unknown outcome must
not be retried.

## Routine versions

The first line of each report identifies the skill version.

| Version | Change |
| ------- | ------ |
| `2026-11-13` | Moved the workflow into the explicitly invoked `story-ingest` skill. |
| `2026-11-12` | Added tier, State, and source label to the routine payload (#133). |
| `2026-10-18` | English-only; one citation link and outlet label. |
