"""
LangGraph analyst tools — each tool wraps a repository call.
org_id is always injected by ExecutionGuard before the tool is called,
so tools must accept it as a keyword argument but never trust a caller-supplied value
that bypasses the guard (the guard overwrites it).
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession

from repositories.analytics import AnalyticsRepository
from repositories.sentiment import SentimentRepository
from repositories.insights import InsightRepository
from repositories.trends import TrendRepository
from core.logging import get_logger

logger = get_logger(__name__)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _default_window(days: int = 30) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    return now - timedelta(days=days), now


# ── Tool factory ─────────────────────────────────────────────────────────────
# Tools are created as closures over the AsyncSession so LangGraph can call them.
# The graph receives the session-bound tool set at runtime.

def build_tools(session: AsyncSession) -> list:
    """Return a list of LangChain tools scoped to this DB session."""

    analytics_repo = AnalyticsRepository(session)
    sentiment_repo = SentimentRepository(session)
    insight_repo = InsightRepository(session)
    trend_repo = TrendRepository(session)

    @tool
    async def get_kpi_metrics(org_id: str) -> dict[str, Any]:
        """Fetch the organisation's top-level KPI metrics for the last 30 days:
        transaction volume, application count, conversion rate, and satisfaction score."""
        start, end = _default_window(30)
        return await analytics_repo.get_kpi_metrics(org_id, start, end)

    @tool
    async def get_funnel_data(
        org_id: str,
        sector: Annotated[str, "retail_banking | fintech | ecommerce"] = "retail_banking",
        days: int = 30,
    ) -> list[dict]:
        """Fetch funnel stage counts for the organisation.
        Returns a list of {stage, count, drop_off_rate} dicts."""
        start, end = _default_window(days)
        return await analytics_repo.get_funnel(org_id, start, end, sector=sector)

    @tool
    async def get_cohort_data(org_id: str, days: int = 90) -> list[dict]:
        """Fetch cohort retention data for the organisation.
        Returns a matrix of retention rates by cohort week."""
        start, end = _default_window(days)
        return await analytics_repo.get_cohort_data(org_id, start, end)

    @tool
    async def get_top_products(org_id: str, limit: int = 10, days: int = 30) -> list[dict]:
        """Fetch the top financial products by transaction volume or event count.
        Returns a list of {product_name, product_type, count, revenue_gbp} dicts."""
        start, end = _default_window(days)
        return await analytics_repo.get_top_products(org_id, start, end, limit=limit)

    @tool
    async def get_sentiment_summary(org_id: str) -> dict[str, Any]:
        """Fetch the sentiment distribution and average score for customer feedback.
        Returns positive/neutral/negative counts, percentages, and average_score."""
        return await sentiment_repo.get_summary(org_id)

    @tool
    async def get_insights(
        org_id: str,
        insight_type: Annotated[str, "churn_prevention | cross_sell | product_acquisition | feature_adoption | retention | conversion_optimization | all"] = "all",
        limit: int = 10,
    ) -> list[dict]:
        """Fetch AI-generated insights for the organisation.
        Filter by insight_type or use 'all' to retrieve the most recent."""
        filters = {} if insight_type == "all" else {"type": insight_type}
        rows = await insight_repo.list_insights(org_id, filters=filters, limit=limit)
        return [r.model_dump() if hasattr(r, "model_dump") else dict(r) for r in rows]

    @tool
    async def get_trends(org_id: str, limit: int = 5) -> list[dict]:
        """Fetch the most recent AI-predicted market and product trends."""
        rows = await trend_repo.list_trends(org_id, limit=limit)
        return [r.model_dump() if hasattr(r, "model_dump") else dict(r) for r in rows]

    @tool
    async def search_insights(org_id: str, query: str, limit: int = 5) -> list[dict]:
        """Semantic search over past AI insights using the query string.
        Returns the most relevant insight summaries."""
        rows = await insight_repo.search(org_id, query=query, limit=limit)
        return [r.model_dump() if hasattr(r, "model_dump") else dict(r) for r in rows]

    @tool
    async def get_churn_signals(org_id: str, days: int = 30) -> dict[str, Any]:
        """Fetch behavioural signals associated with customer churn risk:
        login frequency decline, payment failure rate, dormant account count."""
        start, end = _default_window(days)
        return await analytics_repo.get_churn_signals(org_id, start, end)

    @tool
    async def get_engagement_scores(org_id: str, days: int = 30) -> dict[str, Any]:
        """Fetch per-segment engagement scores and overall engagement index."""
        start, end = _default_window(days)
        return await analytics_repo.get_engagement_signals(org_id, start, end)

    return [
        get_kpi_metrics,
        get_funnel_data,
        get_cohort_data,
        get_top_products,
        get_sentiment_summary,
        get_insights,
        get_trends,
        search_insights,
        get_churn_signals,
        get_engagement_scores,
    ]
