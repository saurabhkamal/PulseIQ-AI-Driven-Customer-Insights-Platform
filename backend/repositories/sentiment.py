from datetime import datetime, timedelta, timezone

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
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
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

    async def get_enriched_by_org(
        self,
        org_id: str,
        sentiment: str | None = None,
        product_id: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[dict], int]:
        """Return sentiment results enriched with product name via LEFT JOIN."""
        filters = [SentimentResult.organization_id == org_id]
        if sentiment:
            filters.append(SentimentResult.sentiment == sentiment)
        if product_id:
            filters.append(Feedback.product_id == product_id)

        base_q = (
            select(
                SentimentResult.id,
                SentimentResult.feedback_id,
                SentimentResult.sentiment,
                SentimentResult.score,
                SentimentResult.confidence,
                SentimentResult.analyzed_at,
                Product.name.label("product_name"),
            )
            .outerjoin(Feedback, SentimentResult.feedback_id == Feedback.id)
            .outerjoin(Product, Feedback.product_id == Product.id)
            .where(*filters)
        )

        total = (await self.session.execute(
            select(func.count()).select_from(base_q.subquery())
        )).scalar_one()

        rows = (await self.session.execute(
            base_q.order_by(SentimentResult.analyzed_at.desc()).offset(offset).limit(limit)
        )).all()

        return [
            {
                "id": str(r.id),
                "feedback_id": str(r.feedback_id),
                "sentiment": r.sentiment,
                "score": float(r.score),
                "confidence": float(r.confidence),
                "analyzed_at": r.analyzed_at,
                "product_name": r.product_name,
            }
            for r in rows
        ], total

    async def get_charts_data(self, org_id: str) -> dict:
        """Return aggregated chart data: weekly trend, by source, by product."""
        since = datetime.now(timezone.utc) - timedelta(weeks=12)

        # 1. Weekly trend by sentiment (last 12 weeks)
        weekly_rows = (await self.session.execute(
            select(
                func.date_trunc("week", SentimentResult.analyzed_at).label("week"),
                SentimentResult.sentiment,
                func.count(SentimentResult.id).label("count"),
            )
            .where(
                SentimentResult.organization_id == org_id,
                SentimentResult.analyzed_at >= since,
            )
            .group_by("week", SentimentResult.sentiment)
            .order_by("week")
        )).all()

        weeks: dict[str, dict] = {}
        for r in weekly_rows:
            key = r.week.date().isoformat()
            if key not in weeks:
                weeks[key] = {"week": key, "positive": 0, "neutral": 0, "negative": 0, "total": 0}
            weeks[key][r.sentiment] = r.count
            weeks[key]["total"] += r.count
        weekly_trend = list(weeks.values())

        # 2. By feedback source channel
        source_rows = (await self.session.execute(
            select(
                Feedback.source,
                SentimentResult.sentiment,
                func.count(SentimentResult.id).label("count"),
            )
            .join(Feedback, SentimentResult.feedback_id == Feedback.id)
            .where(SentimentResult.organization_id == org_id)
            .group_by(Feedback.source, SentimentResult.sentiment)
            .order_by(func.count(SentimentResult.id).desc())
        )).all()

        sources: dict[str, dict] = {}
        for r in source_rows:
            if r.source not in sources:
                sources[r.source] = {"source": r.source, "positive": 0, "neutral": 0, "negative": 0, "total": 0}
            sources[r.source][r.sentiment] = r.count
            sources[r.source]["total"] += r.count
        by_source = sorted(sources.values(), key=lambda x: x["total"], reverse=True)

        # 3. By product (feedback linked to a product)
        product_rows = (await self.session.execute(
            select(
                Product.name.label("product"),
                SentimentResult.sentiment,
                func.count(SentimentResult.id).label("count"),
            )
            .join(Feedback, SentimentResult.feedback_id == Feedback.id)
            .join(Product, Feedback.product_id == Product.id)
            .where(
                SentimentResult.organization_id == org_id,
                Feedback.product_id.is_not(None),
            )
            .group_by(Product.name, SentimentResult.sentiment)
            .order_by(func.count(SentimentResult.id).desc())
        )).all()

        products: dict[str, dict] = {}
        for r in product_rows:
            if r.product not in products:
                products[r.product] = {"product": r.product, "positive": 0, "neutral": 0, "negative": 0, "total": 0}
            products[r.product][r.sentiment] = r.count
            products[r.product]["total"] += r.count
        by_product = sorted(products.values(), key=lambda x: x["total"], reverse=True)

        return {
            "weekly_trend": weekly_trend,
            "by_source": by_source,
            "by_product": by_product,
        }
