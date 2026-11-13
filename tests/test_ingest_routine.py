"""Contract between the Stopgap Routine prompt and the ingest API.

The routine's prompt lives in docs/story-ingest-routine.md. Its example payload is the
fixture: what the routine sends must keep ingesting, and its state list must match the
list readers pick from at Onboarding.
"""

import json
import re
from pathlib import Path

import pytest

from app.onboarding import INDIAN_STATES

ROUTINE_DOC = (
    Path(__file__).resolve().parent.parent / "docs" / "story-ingest-routine.md"
)
STORIES_URL = "/api/v1/stories"
VALID_HEADERS = {"X-API-Key": "test-api-key"}
TIERS = ("national", "state", "international")


def _prompt() -> str:
    text = ROUTINE_DOC.read_text(encoding="utf-8")
    return text.split("## Prompt\n", 1)[1].split("```text\n", 1)[1].split("\n```", 1)[0]


def _example_payload() -> dict:
    match = re.search(r"^   \{\n.*?^   \}$", _prompt(), re.MULTILINE | re.DOTALL)
    assert match, "the prompt has no example payload"
    return json.loads(match.group(0))


def _prompt_states() -> list[str]:
    lines = _prompt().splitlines()
    index = next(
        i for i, line in enumerate(lines) if "copied exactly from this list" in line
    )
    return [name.strip() for name in lines[index + 1].split(",")]


def test_prompt_version_is_recorded():
    first_line = _prompt().splitlines()[0]
    version = re.fullmatch(r"Prompt version: (\d{4}-\d{2}-\d{2})", first_line)
    assert version, "the prompt must start with its version"

    versions_table = ROUTINE_DOC.read_text(encoding="utf-8").split(
        "## Prompt versions", 1
    )[1]
    latest = re.search(r"^\| `(\d{4}-\d{2}-\d{2})` \|", versions_table, re.MULTILINE)
    assert latest and latest.group(1) == version.group(1)


def test_example_payload_carries_tier_state_and_source_label():
    payload = _example_payload()

    assert payload["tier"] in TIERS
    assert payload["source_label"].strip()
    assert payload["source_url"]
    if payload["tier"] == "state":
        assert payload["state"] in INDIAN_STATES
    else:
        assert payload["state"] is None


def test_prompt_state_list_matches_saransh_states():
    assert _prompt_states() == list(INDIAN_STATES)


@pytest.mark.parametrize(
    "overrides",
    [
        {},
        {"tier": "national", "state": None},
        {"tier": "international", "state": None},
    ],
)
def test_routine_payload_is_accepted_by_ingest(client, overrides):
    """The prompt's tier must be accepted and returned by the API."""
    payload = {**_example_payload(), **overrides}

    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)

    assert response.status_code == 201
    data = response.json()
    assert data["source_label"] == payload["source_label"]
    assert data["tier"] == payload["tier"]
    assert data["state"] == payload["state"]
