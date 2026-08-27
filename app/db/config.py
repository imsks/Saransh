"""Resolve DATABASE_URL for local Docker vs host development."""

from __future__ import annotations

import os
import socket
from urllib.parse import urlparse, urlunparse


def _in_docker() -> bool:
    return os.path.exists("/.dockerenv")


def _resolve_hostname(hostname: str) -> bool:
    try:
        socket.getaddrinfo(hostname, None)
        return True
    except socket.gaierror:
        return False


def get_database_url(raw_url: str | None = None) -> str:
    """Normalize DATABASE_URL so host-side dev can reach Rajniti Postgres."""
    url = raw_url or os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@127.0.0.1:5432/rajniti",
    )
    parsed = urlparse(url)

    if parsed.hostname == "postgres" and not _in_docker() and not _resolve_hostname("postgres"):
        netloc = parsed.netloc.replace("postgres", "localhost", 1)
        parsed = parsed._replace(netloc=netloc)
        url = urlunparse(parsed)

    return url
