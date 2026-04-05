import math

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from repositories.sentiment import SentimentRepository
from schemas.sentiment import SentimentResponse, SentimentSummary, SentimentResultResponse

logger = get_logger(__name__)


class SentimentService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = SentimentRepository(session)

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
        rows, total = await self.repo.get_by_org(
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
