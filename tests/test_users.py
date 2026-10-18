"""Tests for /users/sync, /me and /me/onboarding, and the shared onboarding rules."""

import uuid

import pytest

from app.db.models import User
from app.onboarding import QUESTIONS

INTERNAL = {"X-API-Key": "test-internal-key"}
REQUIRED = {"political_ideology": "Centrist", "state": "Bihar", "age_group": "26-35"}


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
    [{}, {"X-API-Key": "wrong"}, {"X-API-Key": "test-api-key"}],
)
def test_user_endpoints_require_the_internal_key(client, headers):
    """The ingest key and missing or wrong keys must never act as a User."""
    user_id = _sync(client).json()["id"]
    headers = {**headers, "X-User-Id": user_id}

    assert _sync(client).status_code == 200
    assert (
        client.post("/api/v1/users/sync", json={}, headers=headers).status_code == 401
    )
    assert client.get("/api/v1/me", headers=headers).status_code == 401
    assert (
        client.put(
            "/api/v1/me/onboarding", json={"answers": {}}, headers=headers
        ).status_code
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
        json={"id": bob, "answers": {**REQUIRED}},
        headers=_as(alice),
    )

    assert response.json()["id"] == alice
    assert client.get("/api/v1/me", headers=_as(bob)).json()["onboarded"] is False


# ---------------------------------------------------------------------------
# POST /users/sync
# ---------------------------------------------------------------------------


def test_first_sign_in_creates_a_user_with_every_question_open(client, db_session):
    response = _sync(client, user_id="google-new")

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["onboarded"] is False
    assert [q["key"] for q in body["questions"]] == [q.key for q in QUESTIONS]

    user = db_session.get(User, "google-new")
    assert user.username is None
    assert user.onboarding_completed is False
    assert user.created_at and user.updated_at


def test_repeat_sign_in_refreshes_profile_without_touching_answers(client, db_session):
    user = _rajniti_user(db_session, name="Old", state="Kerala", username="priya")

    body = _sync(
        client, user_id=user.id, email=user.email, name="New", picture="p2"
    ).json()

    assert body["created"] is False
    assert body["name"] == "New"
    assert body["picture"] == "p2"
    db_session.refresh(user)
    assert (user.state, user.username) == ("Kerala", "priya")


def test_sync_refuses_an_email_owned_by_another_user(client):
    first = _sync(client).json()

    assert _sync(client, email=first["email"]).status_code == 409


# ---------------------------------------------------------------------------
# GET /me and PUT /me/onboarding
# ---------------------------------------------------------------------------


def test_only_unanswered_questions_are_asked(client, db_session):
    user = _rajniti_user(db_session, state="Bihar", city="", topics_of_interest=[])

    keys = [
        q["key"]
        for q in client.get("/api/v1/me", headers=_as(user.id)).json()["questions"]
    ]

    assert keys == ["political_ideology", "age_group", "phone", "preferred_parties"]


def test_a_rajniti_onboarded_user_is_never_asked(client, db_session):
    user = _rajniti_user(
        db_session,
        **REQUIRED,
        username="priya",
        city="Patna",
        phone="",
        preferred_parties="Others",  # Rajniti stores some lists as joined strings.
        topics_of_interest="Economy, Education",
        onboarding_completed=True,
    )

    body = client.get("/api/v1/me", headers=_as(user.id)).json()

    assert body["onboarded"] is True
    assert body["questions"] == []


def test_onboarding_saves_answers_and_never_reasks_skipped_ones(client, db_session):
    user_id = _sync(client).json()["id"]

    body = client.put(
        "/api/v1/me/onboarding",
        json={"answers": {**REQUIRED, "topics_of_interest": ["Economy"]}},
        headers=_as(user_id),
    ).json()

    assert body["onboarded"] is True
    user = db_session.get(User, user_id)
    assert user.state == "Bihar"
    assert user.topics_of_interest == ["Economy"]
    assert (user.city, user.phone, user.preferred_parties) == ("", "", [])


def test_onboarding_never_overwrites_an_existing_answer(client, db_session):
    user = _rajniti_user(db_session, state="Kerala")

    client.put(
        "/api/v1/me/onboarding",
        json={"answers": {**REQUIRED}},
        headers=_as(user.id),
    )

    db_session.refresh(user)
    assert user.state == "Kerala"


@pytest.mark.parametrize(
    "username, completed",
    [(None, False), ("priya", True)],
)
def test_rajniti_flag_is_set_only_when_rajniti_has_everything(
    client, db_session, username, completed
):
    user = _rajniti_user(db_session, username=username)

    client.put(
        "/api/v1/me/onboarding", json={"answers": {**REQUIRED}}, headers=_as(user.id)
    )

    db_session.refresh(user)
    assert user.onboarding_completed is completed


@pytest.mark.parametrize(
    "answers",
    [
        {"state": "Bihar", "age_group": "26-35"},
        {**REQUIRED, "state": "Atlantis"},
        {**REQUIRED, "political_ideology": ["Centrist"]},
        {**REQUIRED, "topics_of_interest": ["Cricket"]},
        {**REQUIRED, "topics_of_interest": "Economy"},
        {**REQUIRED, "city": "x" * 101},
    ],
)
def test_invalid_onboarding_answers_return_422_and_save_nothing(
    client, db_session, answers
):
    user_id = _sync(client).json()["id"]

    response = client.put(
        "/api/v1/me/onboarding", json={"answers": answers}, headers=_as(user_id)
    )

    assert response.status_code == 422
    assert db_session.get(User, user_id).state is None
