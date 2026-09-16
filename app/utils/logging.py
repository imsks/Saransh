"""Structured logging for the Saransh backend."""

from __future__ import annotations

import logging
import sys
from typing import Optional

import structlog

from app.config import settings

SERVICE_NAME = "saransh-api"


def setup_logging() -> None:
    """Route stdlib and structlog records through one renderer: JSON in prod, console locally."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    renderer = (
        structlog.processors.JSONRenderer()
        if settings.is_production
        else structlog.dev.ConsoleRenderer()
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                renderer,
            ],
        )
    )

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)

    # Let uvicorn/gunicorn records reach the root handler instead of their own.
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error", "gunicorn.error"):
        server_logger = logging.getLogger(name)
        server_logger.handlers = []
        server_logger.propagate = True


def get_logger(name: Optional[str] = None) -> structlog.stdlib.BoundLogger:
    """Return a logger bound to the backend service name.

    Stays lazy so module-level loggers pick up setup_logging() whenever it runs.
    """
    if name:
        return structlog.get_logger(name, service=SERVICE_NAME)
    return structlog.get_logger(service=SERVICE_NAME)
