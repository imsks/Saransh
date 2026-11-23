"""Text limits for Stories at ingest."""

import unicodedata

SUMMARY_MAX_WORDS = 60
SUMMARY_MAX_CHARACTERS = 400
HEADLINE_MAX_CHARACTERS = 70


def word_count(text: str) -> int:
    return sum(
        any(not unicodedata.category(char).startswith("P") for char in token)
        for token in text.split()
    )
