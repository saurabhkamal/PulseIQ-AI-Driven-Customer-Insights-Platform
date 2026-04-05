import logging
import sys
import structlog
from .config import get_settings

settings = get_settings()


def configure_logging() -> None:
    log_level = logging.DEBUG if settings.debug else logging.INFO

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.JSONRenderer() if not settings.debug
            else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
    )

    # Silence noisy third-party loggers in production
    for name in ("uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(name).setLevel(
            logging.DEBUG if settings.debug else logging.WARNING
        )


def get_logger(name: str) -> structlog.BoundLogger:
    return structlog.get_logger(name)
