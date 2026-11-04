"""Tests for /users/sync, /me and /me/onboarding, and Saransh's onboarding rules."""

import uuid

import pytest
from sqlalchemy import delete

from app.db.models import User, UserPreferences
from app.onboarding import (
    COMING_SOON_INTERESTS,
    INDIAN_STATES,
    LIVE_TOPICS,
    OnboardingAnswers,
    rajniti_state,
)

INTERNAL = {"X-API-Key": "test-internal-key"}
ANSWERS = {"display_name": "Priya", "state": "Bihar"}


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
        **{"onboarding_completed": False, **fields},
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


def test_first_sign_in_creates_a_user_with_nothing_answered(client, db_session):
    response = _sync(client, user_id="google-new")

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["onboarded"] is False
    assert body["display_name"] == "Priya Sharma"
    assert (body["state"], body["topics"]) == (None, [])

    user = db_session.get(User, "google-new")
    assert user.onboarding_completed is False
    assert user.created_at and user.updated_at
    # Nothing is stored for Saransh until the User submits.
    assert db_session.get(UserPreferences, "google-new") is None


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


def test_onboarding_saves_only_saransh_preferences(client, db_session):
    user_id = _sync(client).json()["id"]

    body = _put(
        client,
        user_id,
        topics=["politics", "civic"],
        coming_soon_interests=["sports"],
    ).json()

    assert body["onboarded"] is True
    assert body["display_name"] == "Priya"
    assert body["state"] == "Bihar"
    assert body["topics"] == ["politics", "civic"]
    assert body["coming_soon_interests"] == ["sports"]
    assert db_session.get(UserPreferences, user_id).onboarding_completed is True
    assert client.get("/api/v1/me", headers=_as(user_id)).json() == body


def test_onboarding_never_writes_rajnitis_columns(client, db_session):
    user = _rajniti_user(db_session, name="Rajniti Name", state="Kerala")

    _put(client, user.id, display_name="Saransh Name", state="Bihar")

    db_session.refresh(user)
    assert (user.name, user.state) == ("Rajniti Name", "Kerala")


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


def test_me_returns_rajnitis_state_only_when_it_matches_a_saransh_state(
    client, db_session
):
    matching = _rajniti_user(db_session, state="Uttar Pradesh")
    unknown = _rajniti_user(db_session, state="uttar pradesh")
    missing = _rajniti_user(db_session)

    def read(user):
        return client.get("/api/v1/me", headers=_as(user.id)).json()["rajniti_state"]

    assert read(matching) == "Uttar Pradesh"
    assert read(unknown) is None
    assert read(missing) is None


def test_resubmitting_onboarding_replaces_saransh_answers(client):
    user_id = _sync(client).json()["id"]
    _put(client, user_id, topics=["politics"])

    body = _put(client, user_id, state="Goa", topics=[]).json()

    assert (body["state"], body["topics"]) == ("Goa", [])


@pytest.mark.parametrize(
    "answers",
    [
        {"display_name": "   "},
        {"display_name": "x" * 101},
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
    user_id = _sync(client).json()["id"]

    response = _put(client, user_id, **answers)

    assert response.status_code == 422
    assert db_session.get(UserPreferences, user_id) is None
    assert client.get("/api/v1/me", headers=_as(user_id)).json()["onboarded"] is False


@pytest.mark.parametrize("missing", ["display_name", "state"])
def test_name_and_state_are_both_required(client, missing):
    user_id = _sync(client).json()["id"]
    body = {k: v for k, v in ANSWERS.items() if k != missing}

    response = client.put("/api/v1/me/onboarding", json=body, headers=_as(user_id))

    assert response.status_code == 422


def test_deleting_the_users_row_cascades_to_preferences(client, db_session):
    user_id = _sync(client).json()["id"]
    _put(client, user_id)
    assert db_session.get(UserPreferences, user_id) is not None

    db_session.execute(delete(User).where(User.id == user_id))
    db_session.commit()
    db_session.expire_all()

    assert db_session.get(UserPreferences, user_id) is None


# ---------------------------------------------------------------------------
# OnboardingAnswers (pure rules)
# ---------------------------------------------------------------------------


def test_validate_accepts_name_and_state_alone():
    answers = OnboardingAnswers.validate({"display_name": " Priya ", "state": "Goa"})

    assert answers == OnboardingAnswers("Priya", "Goa", (), ())


def test_validate_allows_three_topics_and_drops_duplicates():
    answers = OnboardingAnswers.validate(
        {**ANSWERS, "topics": ["civic", "civic", "crime", "business"]}
    )

    assert answers.topics == ("civic", "crime", "business")


def test_entertainment_and_sports_are_coming_soon_only():
    assert not set(COMING_SOON_INTERESTS) & set(LIVE_TOPICS)
    assert set(COMING_SOON_INTERESTS) == {"entertainment", "sports"}


def test_rajniti_state_must_match_exactly():
    assert rajniti_state(INDIAN_STATES[0]) == INDIAN_STATES[0]
    assert rajniti_state(INDIAN_STATES[0].lower()) is None
    assert rajniti_state(None) is None
