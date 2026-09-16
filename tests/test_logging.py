"""Tests for the backend structured logger."""

import logging

import structlog

from app.utils import SERVICE_NAME, get_logger, setup_logging


def test_logger_binds_the_service_name():
    with structlog.testing.capture_logs() as logs:
        get_logger(__name__).info("smoke.event", answer=42)

    assert logs[0]["service"] == SERVICE_NAME
    assert logs[0]["event"] == "smoke.event"
    assert logs[0]["answer"] == 42


def test_setup_logging_installs_a_single_root_handler():
    setup_logging()
    root = logging.getLogger()

    assert len(root.handlers) == 1
    assert isinstance(root.handlers[0].formatter, structlog.stdlib.ProcessorFormatter)


def test_module_level_loggers_pick_up_later_configuration():
    """get_logger stays lazy, so import-time loggers are not frozen to defaults."""
    logger = get_logger("app.some.module")
    setup_logging()

    with structlog.testing.capture_logs() as logs:
        logger.info("late.event")

    assert logs[0]["service"] == SERVICE_NAME
