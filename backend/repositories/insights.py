from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.insight import Insight
from .base import BaseRepository


class InsightRepository(BaseRepository[Insight]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Insight, session)

    async def get_by_org(
        self,
        org_id: str,
        insight_type: str | None = None,
        priority: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Insight], int]:
        filters = [Insight.organization_id == org_id]
        if insight_type:
            filters.append(Insight.type == insight_type)
        if priority:
            filters.append(Insight.priority == priority)
        return await self.list(
            *filters,
            offset=offset,
            limit=limit,
            order_by=Insight.generated_at.desc(),
        )

    async def delete_expired(self, org_id: str) -> int:
        from datetime import datetime, timezone
        from sqlalchemy import delete
        result = await self.session.execute(
            delete(Insight).where(
                Insight.organization_id == org_id,
                Insight.expires_at < datetime.now(timezone.utc),
            )
        )
        return result.rowcount
