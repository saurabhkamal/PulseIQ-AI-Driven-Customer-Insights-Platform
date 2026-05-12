from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
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

    async def get_insights(self, org_id: str) -> dict:
        """Return pre-aggregated data for all 6 trends dashboard visualisations."""

        # 1. Signal strength breakdown
        sig_rows = (await self.session.execute(
            select(
                TrendPrediction.signal_strength,
                func.count(TrendPrediction.id).label("count"),
            )
            .where(TrendPrediction.organization_id == org_id)
            .group_by(TrendPrediction.signal_strength)
        )).all()
        signal_breakdown = [{"signal_strength": r.signal_strength, "count": r.count} for r in sig_rows]

        # 2. Count by category
        cat_rows = (await self.session.execute(
            select(
                func.coalesce(TrendPrediction.category, "Uncategorised").label("category"),
                func.count(TrendPrediction.id).label("count"),
            )
            .where(TrendPrediction.organization_id == org_id)
            .group_by("category")
            .order_by(func.count(TrendPrediction.id).desc())
        )).all()
        by_category = [{"category": r.category, "count": r.count} for r in cat_rows]

        # 3. Scatter points (horizon_days × confidence)
        scatter_rows = (await self.session.execute(
            select(
                TrendPrediction.id,
                TrendPrediction.title,
                TrendPrediction.horizon_days,
                TrendPrediction.confidence,
                TrendPrediction.signal_strength,
                TrendPrediction.category,
            )
            .where(
                TrendPrediction.organization_id == org_id,
                TrendPrediction.horizon_days.is_not(None),
                TrendPrediction.confidence.is_not(None),
            )
        )).all()
        scatter_points = [
            {
                "id": r.id,
                "title": r.title,
                "horizon_days": r.horizon_days,
                "confidence": round(float(r.confidence), 3),
                "signal_strength": r.signal_strength,
                "category": r.category or "Uncategorised",
            }
            for r in scatter_rows
        ]

        # 4. Trend volume by week (last 12 weeks)
        since = datetime.now(timezone.utc) - timedelta(weeks=12)
        vol_rows = (await self.session.execute(
            select(
                func.date_trunc("week", TrendPrediction.generated_at).label("week"),
                func.count(TrendPrediction.id).label("count"),
            )
            .where(
                TrendPrediction.organization_id == org_id,
                TrendPrediction.generated_at >= since,
            )
            .group_by("week")
            .order_by("week")
        )).all()
        volume_by_week = [{"week": r.week.date().isoformat(), "count": r.count} for r in vol_rows]

        # 5. Average confidence per category
        conf_rows = (await self.session.execute(
            select(
                func.coalesce(TrendPrediction.category, "Uncategorised").label("category"),
                func.avg(TrendPrediction.confidence).label("avg_confidence"),
                func.count(TrendPrediction.id).label("count"),
            )
            .where(
                TrendPrediction.organization_id == org_id,
                TrendPrediction.confidence.is_not(None),
            )
            .group_by("category")
            .order_by(func.avg(TrendPrediction.confidence).desc())
        )).all()
        category_confidence = [
            {"category": r.category, "avg_confidence": round(float(r.avg_confidence), 3), "count": r.count}
            for r in conf_rows
        ]

        # 6. All trends for emerging vs maturing classification
        all_rows = (await self.session.execute(
            select(
                TrendPrediction.id,
                TrendPrediction.title,
                TrendPrediction.horizon_days,
                TrendPrediction.confidence,
                TrendPrediction.signal_strength,
                TrendPrediction.category,
            )
            .where(TrendPrediction.organization_id == org_id)
            .order_by(TrendPrediction.generated_at.desc())
        )).all()

        emerging, maturing, monitoring = [], [], []
        for t in all_rows:
            item = {
                "id": t.id,
                "title": t.title,
                "horizon_days": t.horizon_days,
                "confidence": round(float(t.confidence), 3) if t.confidence else 0.0,
                "signal_strength": t.signal_strength,
                "category": t.category or "Uncategorised",
            }
            if t.horizon_days is None or t.horizon_days > 60:
                emerging.append(item)
            elif t.horizon_days <= 30:
                maturing.append(item)
            else:
                monitoring.append(item)

        return {
            "signal_breakdown": signal_breakdown,
            "by_category": by_category,
            "scatter_points": scatter_points,
            "volume_by_week": volume_by_week,
            "category_confidence": category_confidence,
            "emerging": emerging,
            "maturing": maturing,
            "monitoring": monitoring,
            "total": len(all_rows),
        }
