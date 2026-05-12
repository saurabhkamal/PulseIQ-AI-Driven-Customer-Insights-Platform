from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, delete
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

    async def get_summary(self, org_id: str) -> dict:
        """Return pre-aggregated data for the insights dashboard visualisations."""

        # 1. Priority breakdown (total counts)
        pri_rows = (await self.session.execute(
            select(
                Insight.priority,
                func.count(Insight.id).label("count"),
            )
            .where(Insight.organization_id == org_id)
            .group_by(Insight.priority)
        )).all()
        priority_breakdown = [{"priority": r.priority, "count": r.count} for r in pri_rows]

        # 2 & 3. By agent × priority (single query serves both charts)
        agent_rows = (await self.session.execute(
            select(
                func.coalesce(Insight.source_agent, Insight.type, "unknown").label("agent"),
                Insight.priority,
                func.count(Insight.id).label("count"),
            )
            .where(Insight.organization_id == org_id)
            .group_by("agent", Insight.priority)
            .order_by(func.count(Insight.id).desc())
        )).all()

        # Pivot into per-agent dicts
        agents: dict[str, dict] = {}
        for r in agent_rows:
            if r.agent not in agents:
                agents[r.agent] = {"agent": r.agent, "total": 0, "high": 0, "medium": 0, "low": 0}
            agents[r.agent][r.priority] = r.count
            agents[r.agent]["total"] += r.count
        by_agent = sorted(agents.values(), key=lambda a: a["total"], reverse=True)

        # 4 & 5. Weekly volume by priority (last 12 weeks — serves both volume and trend charts)
        since = datetime.now(timezone.utc) - timedelta(weeks=12)
        weekly_rows = (await self.session.execute(
            select(
                func.date_trunc("week", Insight.generated_at).label("week"),
                Insight.priority,
                func.count(Insight.id).label("count"),
            )
            .where(
                Insight.organization_id == org_id,
                Insight.generated_at >= since,
            )
            .group_by("week", Insight.priority)
            .order_by("week")
        )).all()

        weeks: dict[str, dict] = {}
        for r in weekly_rows:
            key = r.week.date().isoformat()
            if key not in weeks:
                weeks[key] = {"week": key, "high": 0, "medium": 0, "low": 0, "total": 0}
            weeks[key][r.priority] = r.count
            weeks[key]["total"] += r.count
        volume_by_week = list(weeks.values())

        # Total insight count
        total_row = (await self.session.execute(
            select(func.count(Insight.id)).where(Insight.organization_id == org_id)
        )).scalar_one()

        return {
            "priority_breakdown": priority_breakdown,
            "by_agent": by_agent,
            "volume_by_week": volume_by_week,
            "total": total_row,
        }

    async def delete_expired(self, org_id: str) -> int:
        result = await self.session.execute(
            delete(Insight).where(
                Insight.organization_id == org_id,
                Insight.expires_at < datetime.now(timezone.utc),
            )
        )
        return result.rowcount
