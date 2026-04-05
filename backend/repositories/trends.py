from sqlalchemy.ext.asyncio import AsyncSession

from models.trend import TrendPrediction
from .base import BaseRepository


class TrendRepository(BaseRepository[TrendPrediction]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TrendPrediction, session)

    async def get_by_org(
        self,
        org_id: str,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[TrendPrediction], int]:
        filters = [TrendPrediction.organization_id == org_id]
        if category:
            filters.append(TrendPrediction.category == category)
        return await self.list(
            *filters,
            offset=offset,
            limit=limit,
            order_by=TrendPrediction.generated_at.desc(),
        )
