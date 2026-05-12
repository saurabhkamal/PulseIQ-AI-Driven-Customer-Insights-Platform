from .health import router as health_router
from .auth import router as auth_router
from .users import router as users_router
from .ingestion import router as ingestion_router
from .analytics import router as analytics_router
from .insights import router as insights_router
from .sentiment import router as sentiment_router
from .dashboards import router as dashboards_router
from .export import router as export_router
from .mobile import router as mobile_router
from .admin import router as admin_router
from .analyst import router as analyst_router
from .gdpr import router as gdpr_router
from .compliance import router as compliance_router

__all__ = [
    "health_router", "auth_router", "users_router", "ingestion_router",
    "analytics_router", "insights_router", "sentiment_router",
    "dashboards_router", "export_router", "mobile_router", "admin_router",
    "analyst_router", "gdpr_router", "compliance_router",
]
