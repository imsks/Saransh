import logging
from ..config import settings

def setup_logging():
    """Setup logging configuration for the entire application"""
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        force=True  # This ensures the configuration is applied even if already configured
    )
    
    # Set specific loggers to the same level
    loggers = [
        'app.scrapers',
        'app.processors', 
        'app.ai',
        'app.utils'
    ]
    
    for logger_name in loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Create a logger for this module
    logger = logging.getLogger(__name__)
    logger.info("Logging configured successfully")
