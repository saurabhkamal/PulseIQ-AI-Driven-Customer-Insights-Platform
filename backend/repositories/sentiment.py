from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.sentiment import SentimentResult
from models.feedback import Feedback
from models.product import Product
from .base import BaseRepository


class SentimentRepository(BaseRepository[SentimentResult]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(SentimentResult, session)

    async def get_summary(self, org_id: str) -> dict:
        """Return counts of each sentiment label and average score."""
        result = await self.session.execute(
            select(
                SentimentResult.sentiment,
                func.count(SentimentResult.id).label("count"),
                func.avg(SentimentResult.score).label("avg_score"),
            )
            .where(SentimentResult.organization_id == org_id)
            .group_by(SentimentResult.sentiment)
        )
        rows = result.all()
        total = sum(r.count for r in rows)
        summary = {r.sentiment: r.count for r in rows}
        avg_scores = {r.sentiment: float(r.avg_score or 0) for r in rows}

        positive = summary.get("positive", 0)
        neutral = summary.get("neutral", 0)
        negative = summary.get("negative", 0)
        avg = sum(avg_scores.get(k, 0) * summary.get(k, 0) for k in avg_scores) / max(total, 1)

        return {
            "positive_pct": round(positive / max(total, 1) * 100, 1),
            "neutral_pct": round(neutral / max(total, 1) * 100, 1),
            "negative_pct": round(negative / max(total, 1) * 100, 1),
            "average_score": round(avg, 3),
            "total": total,
        }

    async def get_by_org(
        self,
        org_id: str,
        sentiment: str | None = None,
        product_id: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[SentimentResult], int]:
        filters = [SentimentResult.organization_id == org_id]
        if sentiment:
            filters.append(SentimentResult.sentiment == sentiment)
        if product_id:
            # Join through feedback to filter by product
            filters.append(
                SentimentResult.feedback_id.in_(
                    select(Feedback.id).where(Feedback.product_id == product_id)
                )
            )
        return await self.list(
            *filters,
            offset=offset,
            limit=limit,
            order_by=SentimentResult.analyzed_at.desc(),
        )
