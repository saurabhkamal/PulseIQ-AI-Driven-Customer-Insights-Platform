"""
PulseIQ FastAPI Application — entry point.
"""
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.logging import configure_logging, get_logger
from core.exceptions import PulseIQError, pulseiq_exception_handler, generic_exception_handler
from api.routes import (
    health_router, auth_router, users_router, ingestion_router,
    analytics_router, insights_router, sentiment_router,
    dashboards_router, export_router, mobile_router, admin_router,
)

settings = get_settings()
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("pulseiq_startup", environment=settings.environment)
    yield
    logger.info("pulseiq_shutdown")


app = FastAPI(
    title="PulseIQ API",
    description="AI-Driven Consumer Insights Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ─────────────────────────────────────────────────────────
app.add_exception_handler(PulseIQError, pulseiq_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, generic_exception_handler)

# ── Routers — all versioned under /api/v1 ─────────────────────────────────────
PREFIX = settings.api_prefix

app.include_router(health_router)
app.include_router(auth_router,      prefix=PREFIX)
app.include_router(users_router,     prefix=PREFIX)
app.include_router(ingestion_router, prefix=PREFIX)
app.include_router(analytics_router, prefix=PREFIX)
app.include_router(insights_router,  prefix=PREFIX)
app.include_router(sentiment_router, prefix=PREFIX)
app.include_router(dashboards_router,prefix=PREFIX)
app.include_router(export_router,    prefix=PREFIX)
app.include_router(mobile_router,    prefix=PREFIX)
app.include_router(admin_router,     prefix=PREFIX)
