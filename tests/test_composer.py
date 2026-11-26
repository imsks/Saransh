"""The Feed Mix rules (app/composer.py)."""

import inspect
import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta
from itertools import groupby

import pytest

from app.composer import compose
from app.onboarding import LIVE_TOPICS

HOME = "Bihar"
NOW = datetime(2026, 11, 26, 12, 0)
TIERS = ("national", "state", "international")


@dataclass(frozen=True)
class FakeStory:
    id: uuid.UUID
    tier: str
    state: str | None
    category: str
    created_at: datetime


def make(tier, count, *, state=None, category=None, age=0, first_id=0):
    """`count` Stories of one Tier, cycling through the Topics unless one is given."""
    if tier == "state" and state is None:
        state = HOME
    offset = TIERS.index(tier) * 10_000 + first_id
    return [
        FakeStory(
            id=uuid.UUID(int=offset + n + 1),
            tier=tier,
            state=state,
            category=category or LIVE_TOPICS[n % len(LIVE_TOPICS)],
            created_at=NOW - timedelta(minutes=age + n),
        )
        for n in range(count)
    ]


def ample():
    return [story for tier in TIERS for story in make(tier, 100)]


def cards_for(stories, *, state=HOME, topics=(), read=()):
    return compose(stories, state=state, topics=topics, read_today=list(read))


def already_read(*tiers):
    """Stories shown earlier today, none of them still eligible."""
    return [make(tier, 1, first_id=9_000)[0] for tier in tiers]


def read_day(stories, *, state=HOME, topics=(), at_a_time=15):
    """Read, leave and come back until nothing more is offered."""
    unread, sittings, read = list(stories), [], []
    while cards := cards_for(unread, state=state, topics=topics, read=read):
        seen = cards[:at_a_time]
        sittings.append(seen)
        read += seen
        shown = {card.id for card in seen}
        unread = [story for story in unread if story.id not in shown]
    return sittings


def tiers_of(cards):
    return Counter(card.tier for card in cards)


def longest_run(cards):
    return max(len(list(run)) for _, run in groupby(card.tier for card in cards))


def flat(editions):
    return [card for edition in editions for card in edition]


def test_day_meets_the_tier_targets():
    day = flat(read_day(ample()))

    assert tiers_of(day) == {"national": 25, "state": 15, "international": 10}
    assert len({card.id for card in day}) == 50


def test_every_edition_mixes_all_tiers():
    for edition in read_day(ample()):
        assert set(tiers_of(edition)) == set(TIERS)


def test_targets_count_what_was_read_today():
    read = already_read(*["national"] * 25, *["state"] * 5)

    third = cards_for(ample(), read=read)
    fourth = cards_for(ample(), read=read + third)

    assert len(third) == len(fourth) == 10
    assert tiers_of(third + fourth) == {"state": 10, "international": 10}


def test_state_cards_come_only_from_the_readers_state():
    stories = ample() + make("state", 20, state="Kerala", first_id=500)

    day = flat(read_day(stories))

    assert {card.state for card in day if card.tier == "state"} == {HOME}


@pytest.mark.parametrize("state", [None, "", "Atlantis"])
def test_reader_without_a_valid_state_gets_national_instead(state):
    day = flat(read_day(ample(), state=state))

    assert tiers_of(day) == {"national": 40, "international": 10}


@pytest.mark.parametrize("topics", [["crime"], ["civic", "education"]])
def test_each_tier_is_about_sixty_percent_the_readers_topics(topics):
    for edition in read_day(ample(), topics=topics):
        for tier in TIERS:
            picks = [card for card in edition if card.tier == tier]
            matching = sum(card.category in topics for card in picks)
            assert 0.5 <= matching / len(picks) <= 0.7, (tier, matching, len(picks))


@pytest.mark.parametrize("at_a_time", [1, 4, 7])
@pytest.mark.parametrize("topics", [["crime"], ["civic", "education"]])
def test_coming_back_mid_edition_keeps_the_topic_share_and_mix(topics, at_a_time):
    day = flat(read_day(ample(), topics=topics, at_a_time=at_a_time))

    assert tiers_of(day) == {"national": 25, "state": 15, "international": 10}
    assert longest_run(day) <= 2
    for tier in TIERS:
        picks = [card for card in day if card.tier == tier]
        matching = sum(card.category in topics for card in picks)
        assert 0.5 <= matching / len(picks) <= 0.7, (tier, matching, len(picks))


def test_no_topics_means_newest_first():
    stories = ample()

    cards = cards_for(stories)

    for tier in TIERS:
        picks = [card for card in cards if card.tier == tier]
        assert picks == [s for s in stories if s.tier == tier][: len(picks)]


@pytest.mark.parametrize("category", ["crime", "civic"])
def test_topic_supply_never_leaves_places_empty(category):
    # Only the reader's Topic, then none of it.
    stories = [s for tier in TIERS for s in make(tier, 40, category=category)]

    assert len(cards_for(stories, topics=["crime"])) == 15


def test_no_tier_three_times_in_a_row_across_the_day():
    assert longest_run(flat(read_day(ample()))) <= 2


@pytest.mark.parametrize("tier", TIERS)
def test_run_limit_counts_cards_already_read(tier):
    cards = cards_for(ample(), read=already_read(tier, tier))

    assert cards[0].tier != tier


def test_long_run_happens_only_when_other_tiers_are_used_up():
    stories = make("national", 40) + make("international", 2)

    cards = cards_for(stories)

    assert len(cards) == 15
    last_other = max(i for i, c in enumerate(cards) if c.tier == "international")
    assert longest_run(cards[: last_other + 1]) <= 2


def test_newest_first_within_each_tier():
    cards = cards_for(ample(), topics=["politics"])

    for tier in TIERS:
        times = [card.created_at for card in cards if card.tier == tier]
        assert times == sorted(times, reverse=True)


def test_short_tier_is_filled_from_national_first():
    stories = make("national", 40) + make("state", 1) + make("international", 40)

    counts = tiers_of(cards_for(stories))

    assert counts == {"national": 11, "state": 1, "international": 3}


def test_international_fills_when_national_runs_out():
    stories = make("national", 2) + make("state", 1) + make("international", 40)

    counts = tiers_of(cards_for(stories))

    assert counts == {"national": 2, "state": 1, "international": 12}


def test_state_fills_when_nothing_else_is_left():
    assert tiers_of(cards_for(make("state", 40))) == {"state": 15}


def test_low_supply_returns_what_there_is():
    stories = make("national", 2) + make("international", 1)

    assert len(cards_for(stories)) == 3
    assert cards_for([]) == []


def test_editions_are_15_15_10_10():
    assert [len(edition) for edition in read_day(ample())] == [15, 15, 10, 10]


@pytest.mark.parametrize(
    ("read", "remaining"),
    [
        (0, 15),
        (6, 9),
        (14, 1),
        (15, 15),
        (29, 1),
        (30, 10),
        (39, 1),
        (40, 10),
        (49, 1),
        (50, 0),
        (51, 0),
    ],
)
def test_edition_boundaries(read, remaining):
    cards = cards_for(ample(), read=already_read(*["national"] * read))

    assert len(cards) == remaining


def test_same_inputs_give_the_same_cards_in_any_input_order():
    stories = ample()
    reader = {"topics": ["crime"], "read": already_read("national", "state")}

    assert cards_for(stories, **reader) == cards_for(stories[::-1], **reader)


def test_equal_times_are_ordered_by_id():
    stories = [
        FakeStory(uuid.UUID(int=n), "national", None, "civic", NOW) for n in (2, 3, 1)
    ]

    assert [card.id.int for card in cards_for(stories)] == [3, 2, 1]


def test_signature_takes_no_analytics_or_reading_behaviour():
    assert list(inspect.signature(compose).parameters) == [
        "stories",
        "state",
        "topics",
        "read_today",
    ]
