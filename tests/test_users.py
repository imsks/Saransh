"""Tests for /users/sync, /me and /me/onboarding, and Saransh's onboarding rules."""

import uuid

import pytest

from app.db.models import User
from app.onboarding import (
    COMING_SOON_INTERESTS,
    LIVE_TOPICS,
    OnboardingAnswers,
    missing_fields,
)

INTERNAL = {"X-API-Key": "test-internal-key"}
ANSWERS = {"name": "Priya", "state": "Bihar"}
ALL = ("name", "state", "topics")


def _sync(client, user_id=None, **overrides):
    user_id = user_id or f"google-{uuid.uuid4()}"
    payload = {
        "id": user_id,
        "email": f"{user_id}@example.com",
        "name": "Priya Sharma",
        "picture": "https://example.com/p.png",
        **overrides,
    }
    return client.post("/api/v1/users/sync", json=payload, headers=INTERNAL)


def _as(user_id):
    return {**INTERNAL, "X-User-Id": user_id}


def _put(client, user_id, **answers):
    return client.put(
        "/api/v1/me/onboarding", json={**ANSWERS, **answers}, headers=_as(user_id)
    )


def _rajniti_user(db_session, **fields):
    user = User(
        id=f"google-{uuid.uuid4()}",
        email=f"{uuid.uuid4()}@example.com",
        **{"onboarding_completed": False, "onboarded_from": "rajniti", **fields},
    )
    db_session.add(user)
    db_session.commit()
    return user


# ---------------------------------------------------------------------------
# Trust boundary
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "headers",
    [{}, {"X-API-Key": "wrong"}, {"X-API-Key": "test-api-key"}, {"X-API-Key": b"\xe9"}],
)
def test_user_endpoints_require_the_internal_key(client, headers):
    """The ingest key and missing, wrong or non-ASCII keys must never act as a User."""
    user_id = _sync(client).json()["id"]
    headers = {**headers, "X-User-Id": user_id}

    assert (
        client.post("/api/v1/users/sync", json={}, headers=headers).status_code == 401
    )
    assert client.get("/api/v1/me", headers=headers).status_code == 401
    assert (
        client.put("/api/v1/me/onboarding", json=ANSWERS, headers=headers).status_code
        == 401
    )


@pytest.mark.parametrize("user_id", [None, "google-unknown"])
def test_me_rejects_a_missing_or_unknown_user(client, user_id):
    headers = INTERNAL if user_id is None else _as(user_id)
    assert client.get("/api/v1/me", headers=headers).status_code == 401


def test_the_acting_user_comes_from_the_header_not_the_body(client):
    alice = _sync(client).json()["id"]
    bob = _sync(client).json()["id"]

    response = client.put(
        "/api/v1/me/onboarding",
        json={"id": bob, **ANSWERS},
        headers=_as(alice),
    )

    assert response.json()["id"] == alice
    assert client.get("/api/v1/me", headers=_as(bob)).json()["onboarded"] is False


# ---------------------------------------------------------------------------
# POST /users/sync
# ---------------------------------------------------------------------------


def test_first_sign_in_creates_a_saransh_acquired_user(client, db_session):
    response = _sync(client, user_id="google-new")

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["onboarded"] is False
    assert body["onboarded_from"] == "saransh"
    assert body["name"] == "Priya Sharma"
    assert (body["state"], body["topics"]) == (None, [])
    # Google gave a name, so only State and Topics are asked.
    assert body["missing_fields"] == ["state", "topics"]

    user = db_session.get(User, "google-new")
    assert user.onboarding_completed is False
    assert user.onboarded_from == "saransh"
    assert user.saransh_onboarded_at is None
    assert user.created_at and user.updated_at


def test_signing_in_to_saransh_never_changes_where_a_rajniti_user_came_from(
    client, db_session
):
    user = _rajniti_user(db_session, name="Old")

    body = _sync(client, user_id=user.id, email=user.email).json()

    assert body["onboarded_from"] == "rajniti"
    db_session.refresh(user)
    assert user.onboarded_from == "rajniti"


def test_repeat_sign_in_refreshes_profile(client, db_session):
    user = _rajniti_user(db_session, name="Old", state="Kerala")

    body = _sync(
        client, user_id=user.id, email=user.email, name="New", picture="p2"
    ).json()

    assert body["created"] is False
    assert body["picture"] == "p2"
    db_session.refresh(user)
    assert (user.name, user.state) == ("New", "Kerala")


def test_sync_refuses_an_email_owned_by_another_user(client):
    first = _sync(client).json()

    assert _sync(client, email=first["email"]).status_code == 409


def test_concurrent_first_sign_in_for_one_google_account_is_not_rejected(
    client, db_session, monkeypatch
):
    """The loser of an insert race reloads the winner's row instead of getting 409."""
    winner = _rajniti_user(db_session, name="Winner")
    real_get = db_session.get
    calls = {"n": 0}

    def stale_first_read(model, ident, *args, **kwargs):
        calls["n"] += 1
        return None if calls["n"] == 1 else real_get(model, ident, *args, **kwargs)

    monkeypatch.setattr(db_session, "get", stale_first_read)

    response = _sync(client, user_id=winner.id, email=winner.email, name="Late")

    assert response.status_code == 200
    assert response.json()["created"] is False


# ---------------------------------------------------------------------------
# GET /me and PUT /me/onboarding
# ---------------------------------------------------------------------------


def test_onboarding_saves_answers_on_the_users_row(client, db_session):
    user_id = _sync(client, name=None).json()["id"]
    assert client.get("/api/v1/me", headers=_as(user_id)).json()[
        "missing_fields"
    ] == list(ALL)

    body = _put(
        client,
        user_id,
        topics=["politics", "civic"],
        coming_soon_interests=["sports"],
    ).json()

    assert body["onboarded"] is True
    assert body["missing_fields"] == []
    assert (body["name"], body["state"]) == ("Priya", "Bihar")
    assert body["topics"] == ["politics", "civic"]
    assert body["coming_soon_interests"] == ["sports"]
    user = db_session.get(User, user_id)
    assert (user.name, user.state) == ("Priya", "Bihar")
    assert user.saransh_topics == ["politics", "civic"]
    assert user.saransh_interests == ["sports"]
    assert user.saransh_onboarded_at is not None
    assert client.get("/api/v1/me", headers=_as(user_id)).json() == body


def test_a_rajniti_user_is_asked_only_for_saransh_topics(client, db_session):
    user = _rajniti_user(db_session, name="Rajniti Name", state="Kerala")

    me = client.get("/api/v1/me", headers=_as(user.id)).json()
    assert me["missing_fields"] == ["topics"]

    # Name and State were not asked, so submitted values for them are ignored.
    body = client.put(
        "/api/v1/me/onboarding",
        json={"name": "Other", "state": "Bihar", "topics": ["crime"]},
        headers=_as(user.id),
    ).json()

    assert body["onboarded"] is True
    db_session.refresh(user)
    assert (user.name, user.state) == ("Rajniti Name", "Kerala")
    assert user.saransh_topics == ["crime"]


def test_a_state_saransh_does_not_offer_is_asked_again(client, db_session):
    user = _rajniti_user(db_session, name="Asha", state="uttar pradesh")

    me = client.get("/api/v1/me", headers=_as(user.id)).json()
    assert me["missing_fields"] == ["state", "topics"]

    _put(client, user.id, state="Uttar Pradesh")
    db_session.refresh(user)
    assert user.state == "Uttar Pradesh"


@pytest.mark.parametrize("rajniti_flag", [False, True])
def test_saransh_never_reads_or_writes_rajnitis_onboarding_flag(
    client, db_session, rajniti_flag
):
    user = _rajniti_user(db_session, onboarding_completed=rajniti_flag)

    before = client.get("/api/v1/me", headers=_as(user.id)).json()
    assert before["onboarded"] is False  # Rajniti's flag says nothing about Saransh
    assert _put(client, user.id).json()["onboarded"] is True

    db_session.refresh(user)
    assert user.onboarding_completed is rajniti_flag


def test_resubmitting_onboarding_changes_nothing(client, db_session):
    user_id = _sync(client).json()["id"]
    first = _put(client, user_id, topics=["politics"]).json()

    again = _put(client, user_id, state="Goa", topics=[])

    assert again.status_code == 200
    assert again.json() == first


@pytest.mark.parametrize(
    "answers",
    [
        {"name": "   "},
        {"name": "x" * 101},
        {"state": "Atlantis"},
        {"topics": ["cricket"]},
        {"topics": ["politics", "civic", "education", "business"]},
        {"topics": ["entertainment"]},
        {"coming_soon_interests": ["politics"]},
    ],
)
def test_invalid_onboarding_answers_return_422_and_save_nothing(
    client, db_session, answers
):
    user_id = _sync(client, name=None).json()["id"]

    response = _put(client, user_id, **answers)

    assert response.status_code == 422
    user = db_session.get(User, user_id)
    db_session.refresh(user)
    assert (user.name, user.state, user.saransh_onboarded_at) == (None, None, None)
    assert client.get("/api/v1/me", headers=_as(user_id)).json()["onboarded"] is False


@pytest.mark.parametrize("missing", ["name", "state"])
def test_a_missing_name_or_state_is_required(client, missing):
    user_id = _sync(client, name=None).json()["id"]
    body = {k: v for k, v in ANSWERS.items() if k != missing}

    response = client.put("/api/v1/me/onboarding", json=body, headers=_as(user_id))

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# OnboardingAnswers (pure rules)
# ---------------------------------------------------------------------------


def test_validate_accepts_name_and_state_alone():
    answers = OnboardingAnswers.validate({"name": " Priya ", "state": "Goa"}, ALL)

    assert answers == OnboardingAnswers("Priya", "Goa", (), ())


def test_validate_ignores_what_was_not_asked():
    answers = OnboardingAnswers.validate(
        {"name": "", "state": "Atlantis", "topics": ["civic"]}, ["topics"]
    )

    assert answers == OnboardingAnswers(None, None, ("civic",), ())


def test_validate_allows_three_topics_and_drops_duplicates():
    answers = OnboardingAnswers.validate(
        {**ANSWERS, "topics": ["civic", "civic", "crime", "business"]}, ALL
    )

    assert answers.topics == ("civic", "crime", "business")


def test_entertainment_and_sports_are_coming_soon_only():
    assert not set(COMING_SOON_INTERESTS) & set(LIVE_TOPICS)
    assert set(COMING_SOON_INTERESTS) == {"entertainment", "sports"}


@pytest.mark.parametrize(
    ("name", "state", "onboarded", "expected"),
    [
        (None, None, False, ["name", "state", "topics"]),
        ("  ", "Goa", False, ["name", "topics"]),
        ("Priya", "goa", False, ["state", "topics"]),
        ("Priya", "Goa", False, ["topics"]),
        ("Priya", "Goa", True, []),
        (None, "Goa", True, ["name"]),
    ],
)
def test_missing_fields_lists_only_what_the_row_lacks(name, state, onboarded, expected):
    assert missing_fields(name, state, onboarded) == expected
