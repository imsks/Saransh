"""The Feed Mix: which cards a reader gets next.

Pure rules, no database, HTTP or analytics. The caller passes only eligible
Stories (published, tiered, from the last 24 hours, never shown to this reader);
the same inputs always give the same cards.
"""

from __future__ import annotations

from collections.abc import Collection, Iterable, Sequence
from datetime import datetime
from itertools import accumulate
from typing import Protocol, TypeVar
from uuid import UUID

from app.onboarding import INDIAN_STATES

EDITION_SIZES = (15, 15, 10, 10)

NATIONAL = "national"
STATE = "state"
INTERNATIONAL = "international"

DAILY_TIER_TARGETS = {NATIONAL: 25, STATE: 15, INTERNATIONAL: 10}
# Who takes a short Tier's places. State comes last, so a reader is never left
# without cards while eligible Stories remain.
FILL_ORDER = (NATIONAL, INTERNATIONAL, STATE)
TOPIC_SHARE_PERCENT = 60
MAX_TIER_RUN = 2


class ReadStory(Protocol):
    """What the composer reads from a Story already shown to the reader."""

    tier: str
    category: str


class FeedStory(ReadStory, Protocol):
    """What the composer reads from an eligible Story; the `Story` model satisfies it."""

    id: UUID
    state: str | None
    created_at: datetime


S = TypeVar("S", bound=FeedStory)


def compose(
    stories: Iterable[S],
    *,
    state: str | None,
    topics: Collection[str],
    read_today: Sequence[ReadStory],
) -> list[S]:
    """Return the remaining cards of the current Edition, in reading order.

    `read_today` holds every Story read today, oldest first.
    """
    slots = _slots_left(len(read_today))
    if not slots:
        return []

    reader_state = state if state in INDIAN_STATES else None
    pools = _pools(stories, reader_state)
    read_tiers = [story.tier for story in read_today]
    quotas = _quotas(slots, _targets(reader_state), read_tiers, pools)
    picks = {
        tier: _pick(
            pools[tier],
            quotas[tier],
            topics,
            [story for story in read_today if story.tier == tier],
        )
        for tier in pools
    }
    return _interleave(picks, read_tiers)


def _slots_left(read_today: int) -> int:
    for edition_end in accumulate(EDITION_SIZES):
        if read_today < edition_end:
            return edition_end - read_today
    return 0


def _targets(reader_state: str | None) -> dict[str, int]:
    targets = dict(DAILY_TIER_TARGETS)
    if reader_state is None:
        targets[NATIONAL] += targets[STATE]
        targets[STATE] = 0
    return targets


def _pools(stories: Iterable[S], reader_state: str | None) -> dict[str, list[S]]:
    """The Stories this reader can get, by Tier, newest first."""
    pools: dict[str, list[S]] = {tier: [] for tier in DAILY_TIER_TARGETS}
    for story in sorted(stories, key=lambda s: (s.created_at, s.id), reverse=True):
        if story.tier == STATE and (
            reader_state is None or story.state != reader_state
        ):
            continue
        if story.tier in pools:
            pools[story.tier].append(story)
    return pools


def _quotas(
    slots: int,
    targets: dict[str, int],
    read_tiers: Sequence[str],
    pools: dict[str, list[S]],
) -> dict[str, int]:
    """How many cards each Tier gets in the rest of this Edition."""
    counts = {tier: read_tiers.count(tier) for tier in targets}
    wanted = dict.fromkeys(targets, 0)
    # One place at a time to the Tier furthest behind its daily target, so every
    # Edition is mixed and the day ends on the targets.
    for _ in range(slots):
        behind = [tier for tier in targets if counts[tier] < targets[tier]]
        if not behind:
            break
        tier = min(behind, key=lambda t: (counts[t] + 0.5) / targets[t])
        counts[tier] += 1
        wanted[tier] += 1

    quotas = {tier: min(wanted[tier], len(pools[tier])) for tier in targets}
    short = slots - sum(quotas.values())
    for tier in FILL_ORDER:
        extra = min(short, len(pools[tier]) - quotas[tier])
        quotas[tier] += extra
        short -= extra
    return quotas


def _pick(
    pool: list[S], quota: int, topics: Collection[str], read: Sequence[ReadStory]
) -> list[S]:
    """`quota` Stories from one Tier's pool, newest first.

    About 60% of the Tier's cards for the day, counting those already `read`, are
    in the reader's Topics, so leaving mid-Edition does not lower the share.
    """
    if not topics:
        return pool[:quota]
    chosen = [story for story in pool if story.category in topics]
    others = [story for story in pool if story.category not in topics]
    day_share = ((len(read) + quota) * TOPIC_SHARE_PERCENT + 50) // 100
    read_in_topics = sum(story.category in topics for story in read)
    wanted = min(quota, max(0, day_share - read_in_topics))
    # Whichever side runs short, the other takes the places.
    from_topics = min(len(chosen), max(wanted, quota - len(others)))
    ids = {story.id for story in chosen[:from_topics] + others[: quota - from_topics]}
    return [story for story in pool if story.id in ids]


def _interleave(picks: dict[str, list[S]], read_tiers: Sequence[str]) -> list[S]:
    """Mix the Tiers, keeping each Tier's own order.

    The Tier with the most cards left goes next, unless it has just had two in a
    row (counting cards already read) and another Tier still has cards.
    """
    queues = {tier: list(cards) for tier, cards in picks.items() if cards}
    recent = list(read_tiers[-MAX_TIER_RUN:])
    cards: list[S] = []
    while queues:
        allowed = [
            tier for tier in queues if recent.count(tier) < MAX_TIER_RUN
        ] or list(queues)
        tier = max(allowed, key=lambda t: len(queues[t]))
        cards.append(queues[tier].pop(0))
        if not queues[tier]:
            del queues[tier]
        recent = [*recent, tier][-MAX_TIER_RUN:]
    return cards
