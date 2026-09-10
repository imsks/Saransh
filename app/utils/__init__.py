import logging

from ..config import settings


def setup_logging():
    """Configure application logging."""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        force=True,
    )

    logging.getLogger("app").setLevel(getattr(logging, settings.LOG_LEVEL))
    logging.getLogger(__name__).info("Logging configured successfully")
