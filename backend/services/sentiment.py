import math

from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import get_cache, TTL_DASHBOARD
from core.logging import get_logger
from repositories.sentiment import SentimentRepository
from schemas.sentiment import SentimentResponse, SentimentSummary, SentimentResultResponse, SentimentChartsData

logger = get_logger(__name__)


class SentimentService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = SentimentRepository(session)
        self.cache = get_cache()

    async def get_results(
        self,
        org_id: str,
        sentiment: str | None = None,
        product_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SentimentResponse:
        summary_data = await self.repo.get_summary(org_id)
        offset = (page - 1) * page_size
        rows, total = await self.repo.get_enriched_by_org(
            org_id,
            sentiment=sentiment,
            product_id=product_id,
            offset=offset,
            limit=page_size,
        )
        return SentimentResponse(
            summary=SentimentSummary(**summary_data),
            data=[SentimentResultResponse.model_validate(r) for r in rows],
            total=total,
            page=page,
            limit=page_size,
        )

    async def get_summary(self, org_id: str) -> SentimentSummary:
        data = await self.repo.get_summary(org_id)
        return SentimentSummary(**data)

    async def get_charts_data(self, org_id: str) -> SentimentChartsData:
        """Return aggregated chart data for the sentiment page. Cached 60s."""
        cache_key = self.cache.insight_key(org_id, "sentiment_charts")
        cached = await self.cache.get(cache_key)
        if cached:
            return SentimentChartsData(**cached)
        raw = await self.repo.get_charts_data(org_id)
        result = SentimentChartsData(**raw)
        await self.cache.set(cache_key, result.model_dump(), ttl=TTL_DASHBOARD)
        return result
