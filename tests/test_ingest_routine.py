"""Contract between the Stopgap Routine skill and the ingest API.

The skill's example payload is the fixture: what the routine sends must keep
ingesting, and it must use the choices readers pick from at Onboarding.
"""

import json
import re
from pathlib import Path

import pytest
import yaml

from app.onboarding import INDIAN_STATES, LIVE_TOPICS

REPO_ROOT = Path(__file__).resolve().parent.parent
ROUTINE_DOC = REPO_ROOT / "docs" / "story-ingest-routine.md"
SKILL = REPO_ROOT / ".claude" / "skills" / "story-ingest" / "SKILL.md"
STORIES_URL = "/api/v1/stories"
VALID_HEADERS = {"X-API-Key": "test-api-key"}
TIERS = ("national", "state", "international")


def _skill() -> str:
    return SKILL.read_text(encoding="utf-8")


def _example_payload() -> dict:
    match = re.search(r"```json\n(\{.*?\})\n```", _skill(), re.DOTALL)
    assert match, "the skill has no example payload"
    return json.loads(match.group(1))


def test_skill_is_discoverable_and_requires_explicit_invocation():
    match = re.match(r"\A---\n(.*?)\n---\n", _skill(), re.DOTALL)
    assert match, "the skill needs YAML frontmatter"
    metadata = yaml.safe_load(match.group(1))

    assert metadata["name"] == SKILL.parent.name == "story-ingest"
    assert "Use when" in metadata["description"]
    assert metadata["disable-model-invocation"] is True


def test_skill_version_is_recorded():
    version = re.search(
        r"^Routine version: (\d{4}-\d{2}-\d{2})$", _skill(), re.MULTILINE
    )
    assert version, "the skill must declare its version"
    assert (
        f"first line of the report must be `Routine version: {version.group(1)}`"
        in (_skill())
    )
    versions_table = ROUTINE_DOC.read_text(encoding="utf-8").split(
        "## Routine versions", 1
    )[1]
    latest = re.search(r"^\| `(\d{4}-\d{2}-\d{2})` \|", versions_table, re.MULTILINE)
    assert latest and latest.group(1) == version.group(1)


def test_setup_invokes_the_canonical_skill():
    doc = ROUTINE_DOC.read_text(encoding="utf-8")
    assert "../.claude/skills/story-ingest/SKILL.md" in doc
    assert 'claude -p "/story-ingest"' in doc
    assert "## Prompt\n" not in doc


def test_example_payload_carries_tier_state_and_source_label():
    payload = _example_payload()

    assert payload["tier"] in TIERS
    assert payload["category"] in LIVE_TOPICS
    assert payload["source_label"].strip()
    assert payload["source_url"]
    if payload["tier"] == "state":
        assert payload["state"] in INDIAN_STATES
    else:
        assert payload["state"] is None


def test_skill_uses_the_canonical_onboarding_choices():
    assert "[`app/onboarding.py`](../../../app/onboarding.py)" in _skill()
    assert (SKILL.parent / "../../../app/onboarding.py").resolve() == (
        REPO_ROOT / "app" / "onboarding.py"
    )
    assert "INDIAN_STATES" in _skill()
    assert "LIVE_TOPICS" in _skill()


@pytest.mark.parametrize(
    "overrides",
    [
        {},
        {"tier": "national", "state": None},
        {"tier": "international", "state": None},
    ],
)
def test_routine_payload_is_accepted_by_ingest(client, overrides):
    """The skill's tier must be accepted and returned by the API."""
    payload = {**_example_payload(), **overrides}

    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)

    assert response.status_code == 201
    data = response.json()
    assert data["source_label"] == payload["source_label"]
    assert data["tier"] == payload["tier"]
    assert data["state"] == payload["state"]
