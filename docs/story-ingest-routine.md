# Story ingest routine

The shared [`story-ingest` skill](../.claude/skills/story-ingest/SKILL.md) is the
single source of the Stopgap Routine's editorial rules, ingest procedure, error
handling, and report format.

> **STOPGAP:** Stories are published immediately without review and may use a
> publisher's image. Retire this routine when the review screen and publish action
> are available.

## Claude Code Routine setup

Create or edit the scheduled Claude Code Routine for this repository:

1. Set its checkout and working directory to the Saransh repository root, and
   ensure that checkout contains
   [`.claude/skills/story-ingest/SKILL.md`](../.claude/skills/story-ingest/SKILL.md)
   at the version you intend to run. The skill must be present in the checkout
   used by the Routine, not only on your local machine.
2. Set the Routine's prompt to exactly `/story-ingest`, with no additional text.
   The skill has `disable-model-invocation: true`; a pasted copy of its
   instructions or a natural-language request will not invoke it.
3. Configure Claude authentication and the least-privilege permissions needed
   to read the repository, search and open articles and images, and call the
   ingest API.
4. Provide these variables securely in the Routine's environment:

   - `SARANSH_API_BASE`: the API origin only, without `/api/v1` (for example
     `http://localhost:8001` for an isolated local trial).
   - `SARANSH_INGEST_API_KEY`: the API key. Never print it or include it in a report.

This is a live publishing routine: each accepted Story is published immediately,
with no review or dry-run. Verify changes against an isolated test API and test
key before pointing the Routine at production. Each run can create at most 10
Stories; use the Routine's existing schedule.

An existing Routine that contains the old pasted prompt **does not change
automatically**. Edit and save that Routine's prompt as exactly `/story-ingest`.
After changing the Routine or skill, update its checkout and verify the first
line of the next report matches the routine version in the skill. Do not copy the
workflow into the Routine prompt.

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
| `2026-11-13` | Moved the workflow into the explicitly invoked `story-ingest` skill; the Routine prompt must be exactly `/story-ingest`. |
| `2026-11-12` | Added tier, State, and source label to the routine payload (#133). |
| `2026-10-18` | English-only; one citation link and outlet label. |
