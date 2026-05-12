import math
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import get_cache, TTL_DASHBOARD
from core.logging import get_logger
from repositories.analytics import AnalyticsRepository
from repositories.trends import TrendRepository
from schemas.analytics import BehaviorResponse, TrendsResponse, TrendItem, CohortResponse
from schemas.common import PaginatedResponse, PaginationMeta

logger = get_logger(__name__)


class AnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self.analytics = AnalyticsRepository(session)
        self.trends_repo = TrendRepository(session)
        self.cache = get_cache()

    async def get_behavior(
        self,
        org_id: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> BehaviorResponse:
        now = datetime.now(timezone.utc)
        start = start_date or (now - timedelta(days=30))
        end = end_date or now

        funnel = await self.analytics.get_funnel(org_id, start, end)
        top_products = await self.analytics.get_top_products(org_id, start, end)

        return BehaviorResponse(
            period={"start": start.isoformat(), "end": end.isoformat()},
            funnel=funnel,  # type: ignore[arg-type]
            cohorts=[],
            top_products=top_products,
            heatmap_url=None,
        )

    async def get_trends_insights(self, org_id: str) -> dict:
        return await self.trends_repo.get_insights(org_id)

    async def get_trends(
        self,
        org_id: str,
        category: str | None = None,
        limit: int = 20,
        page: int = 1,
    ) -> PaginatedResponse[TrendItem]:
        offset = (page - 1) * limit
        rows, total = await self.trends_repo.get_by_org(
            org_id, category=category, limit=limit, offset=offset
        )
        return PaginatedResponse(
            data=[TrendItem.model_validate(r) for r in rows],
            meta=PaginationMeta(
                page=page, page_size=limit, total=total,
                total_pages=math.ceil(total / limit),
            ),
        )

    async def get_heatmap(self, org_id: str) -> dict:
        return await self.analytics.get_heatmap(org_id)

    async def get_dau_trend(self, org_id: str) -> dict:
        rows = await self.analytics.get_dau_trend(org_id)
        return {"days": rows}

    async def get_new_vs_returning(self, org_id: str) -> dict:
        rows = await self.analytics.get_new_vs_returning(org_id)
        return {"days": rows}

    async def get_segment_engagement(self, org_id: str) -> dict:
        segments = await self.analytics.get_segment_engagement(org_id)
        return {"segments": segments}

    async def get_product_revenue_trend(self, org_id: str) -> dict:
        products = await self.analytics.get_product_revenue_trend(org_id)
        return {"products": products}

    async def get_cohorts(
        self, org_id: str, cohort_by: str = "week", metric: str = "retention"
    ) -> CohortResponse:
        result = await self.analytics.get_cohort_retention(org_id, num_weeks=6)
        return CohortResponse(**result)
