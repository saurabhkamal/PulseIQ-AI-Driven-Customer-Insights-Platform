import hashlib
import json
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import get_cache, TTL_DASHBOARD
from core.exceptions import NotFoundError
from core.logging import get_logger
from repositories.analytics import AnalyticsRepository
from repositories.insights import InsightRepository
from repositories.trends import TrendRepository
from models.dashboard import Dashboard
from repositories.base import BaseRepository
from schemas.dashboard import (
    DashboardCreate, DashboardUpdate, DashboardResponse, DashboardSummaryResponse,
    RevenueDayPoint, TopProductItem, ComplianceAlertSummary, ChurnRiskSummary,
    PipelineStatusData, FunnelStageItem, FunnelHealthData,
    NetSentimentWeek, NetSentimentData, NewVsReturningData,
)
from schemas.analytics import KpiMetric
from schemas.common import PaginatedResponse, PaginationMeta

logger = get_logger(__name__)


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.analytics = AnalyticsRepository(session)
        self.insights = InsightRepository(session)
        self.trends = TrendRepository(session)
        self._repo = BaseRepository(Dashboard, session)
        self.cache = get_cache()

    async def get_kpi_metrics(self, org_id: str) -> list[KpiMetric]:
        cache_key = self.cache.dashboard_key(org_id, "kpi_metrics")
        cached = await self.cache.get(cache_key)
        if cached:
            return [KpiMetric(**m) for m in cached]

        metrics = await self.analytics.get_kpi_metrics(org_id)
        result = [KpiMetric(**m) for m in metrics]
        await self.cache.set(cache_key, [m.model_dump() for m in result], ttl=TTL_DASHBOARD)
        return result

    async def list_dashboards(
        self, org_id: str, page: int = 1, page_size: int = 20
    ) -> PaginatedResponse[DashboardResponse]:
        from sqlalchemy import select, func
        from models.dashboard import Dashboard as DashModel

        offset = (page - 1) * page_size
        rows, total = await self._repo.list(
            Dashboard.organization_id == org_id,
            Dashboard.deleted_at.is_(None),
            offset=offset,
            limit=page_size,
            order_by=Dashboard.created_at.desc(),
        )
        return PaginatedResponse(
            data=[DashboardResponse.model_validate(d) for d in rows],
            meta=PaginationMeta(
                page=page, page_size=page_size, total=total,
                total_pages=math.ceil(total / page_size),
            ),
        )

    async def create_dashboard(
        self, org_id: str, data: DashboardCreate, user_id: str
    ) -> DashboardResponse:
        dash = Dashboard(
            organization_id=org_id,
            created_by=user_id,
            name=data.name,
            description=data.description,
            layout=data.layout,
            widgets=data.widgets,
        )
        dash = await self._repo.create(dash)
        return DashboardResponse.model_validate(dash)

    async def update_dashboard(
        self, org_id: str, dashboard_id: str, data: DashboardUpdate
    ) -> DashboardResponse:
        dash = await self._repo.get_by_id(dashboard_id)
        if not dash or dash.organization_id != org_id or dash.deleted_at:
            raise NotFoundError("Dashboard not found")

        if data.name is not None:
            dash.name = data.name
        if data.description is not None:
            dash.description = data.description
        if data.layout is not None:
            dash.layout = data.layout
        if data.widgets is not None:
            dash.widgets = data.widgets

        return DashboardResponse.model_validate(dash)

    async def get_summary(self, org_id: str) -> DashboardSummaryResponse:
        """Return all aggregated data for the 8 dashboard visualization widgets. Cached 60s."""
        cache_key = self.cache.dashboard_key(org_id, "summary")
        cached = await self.cache.get(cache_key)
        if cached:
            return DashboardSummaryResponse(**cached)

        from models.insight import Insight
        from models.compliance_signal import ComplianceSignal
        from models.sentiment import SentimentResult
        from models.trend import TrendPrediction

        now = datetime.now(timezone.utc)
        since_30d = now - timedelta(days=30)
        since_7d = now - timedelta(days=7)
        since_4w = now - timedelta(weeks=4)

        # 1. Revenue trend — daily for last 30 days
        raw_revenue = await self.analytics.get_revenue_trend(org_id)
        revenue_trend = [RevenueDayPoint(**r) for r in raw_revenue]

        # 2. Top products — last 30 days
        raw_products = await self.analytics.get_top_products(org_id, since_30d, now, limit=5)
        top_products = [
            TopProductItem(id=p["id"], name=p["name"], revenue=p["revenue"], units=p["units"])
            for p in raw_products
        ]

        # 3. Compliance alerts — unreviewed counts by severity
        comp_rows = (await self.session.execute(
            select(
                ComplianceSignal.severity,
                func.count(ComplianceSignal.id).label("count"),
            )
            .where(
                ComplianceSignal.organization_id == org_id,
                ComplianceSignal.reviewed == False,  # noqa: E712
            )
            .group_by(ComplianceSignal.severity)
        )).all()
        comp_counts = {r.severity: r.count for r in comp_rows}
        compliance_alerts = ComplianceAlertSummary(
            high_unreviewed=comp_counts.get("high", 0),
            medium_unreviewed=comp_counts.get("medium", 0),
            low_unreviewed=comp_counts.get("low", 0),
            total_unreviewed=sum(comp_counts.values()),
        )

        # 4. Churn risk — insights from the churn agent, grouped by priority
        churn_rows = (await self.session.execute(
            select(
                Insight.priority,
                func.count(Insight.id).label("count"),
            )
            .where(
                Insight.organization_id == org_id,
                or_(
                    Insight.source_agent.ilike("%churn%"),
                    Insight.type.ilike("%churn%"),
                ),
            )
            .group_by(Insight.priority)
        )).all()
        churn_counts = {r.priority: r.count for r in churn_rows}
        churn_risk = ChurnRiskSummary(
            high=churn_counts.get("high", 0),
            medium=churn_counts.get("medium", 0),
            low=churn_counts.get("low", 0),
            total=sum(churn_counts.values()),
        )

        # 5. Pipeline status — last run timestamp + 7-day counts
        last_insight_at = (await self.session.execute(
            select(func.max(Insight.generated_at))
            .where(Insight.organization_id == org_id)
        )).scalar_one()

        insights_total = (await self.session.execute(
            select(func.count(Insight.id))
            .where(Insight.organization_id == org_id, Insight.generated_at >= since_7d)
        )).scalar_one() or 0

        sentiment_total = (await self.session.execute(
            select(func.count(SentimentResult.id))
            .where(SentimentResult.organization_id == org_id, SentimentResult.analyzed_at >= since_7d)
        )).scalar_one() or 0

        trends_total = (await self.session.execute(
            select(func.count(TrendPrediction.id))
            .where(TrendPrediction.organization_id == org_id, TrendPrediction.generated_at >= since_7d)
        )).scalar_one() or 0

        if last_insight_at and (now - last_insight_at).total_seconds() < 86400:
            pipeline_status_str = "healthy"
        elif last_insight_at and (now - last_insight_at).total_seconds() < 172800:
            pipeline_status_str = "warning"
        else:
            pipeline_status_str = "idle"

        pipeline_status = PipelineStatusData(
            last_run_at=last_insight_at.isoformat() if last_insight_at else None,
            insights_total=insights_total,
            sentiment_total=sentiment_total,
            trends_total=trends_total,
            status=pipeline_status_str,
        )

        # 6. Funnel health — 30-day conversion rate
        raw_funnel = await self.analytics.get_funnel(org_id, since_30d, now)
        if raw_funnel:
            top_count = raw_funnel[0]["count"]
            bottom_count = raw_funnel[-1]["count"]
            conversion_rate = round(bottom_count / max(top_count, 1) * 100, 1)
            stages = [FunnelStageItem(**s) for s in raw_funnel]
            total_top = top_count
        else:
            conversion_rate = 0.0
            stages = []
            total_top = 0

        funnel_health = FunnelHealthData(
            conversion_rate=conversion_rate,
            stages=stages,
            total_top=total_top,
        )

        # 7. Net Sentiment Score — overall + last 4 weeks weekly
        sent_rows = (await self.session.execute(
            select(
                SentimentResult.sentiment,
                func.count(SentimentResult.id).label("count"),
            )
            .where(SentimentResult.organization_id == org_id)
            .group_by(SentimentResult.sentiment)
        )).all()
        sent_counts = {r.sentiment: r.count for r in sent_rows}
        sent_total = sum(sent_counts.values())
        pos = sent_counts.get("positive", 0)
        neg = sent_counts.get("negative", 0)
        pos_pct = round(pos / max(sent_total, 1) * 100, 1)
        neg_pct = round(neg / max(sent_total, 1) * 100, 1)

        weekly_sent_rows = (await self.session.execute(
            select(
                func.date_trunc("week", SentimentResult.analyzed_at).label("week"),
                SentimentResult.sentiment,
                func.count(SentimentResult.id).label("count"),
            )
            .where(
                SentimentResult.organization_id == org_id,
                SentimentResult.analyzed_at >= since_4w,
            )
            .group_by("week", SentimentResult.sentiment)
            .order_by("week")
        )).all()

        weekly_buckets: dict[str, dict] = {}
        for r in weekly_sent_rows:
            key = r.week.date().isoformat()
            if key not in weekly_buckets:
                weekly_buckets[key] = {"positive": 0, "negative": 0, "total": 0}
            weekly_buckets[key][r.sentiment] = r.count
            weekly_buckets[key]["total"] += r.count

        weekly_nss = [
            NetSentimentWeek(
                week=k,
                score=round(
                    v["positive"] / max(v["total"], 1) * 100
                    - v["negative"] / max(v["total"], 1) * 100,
                    1,
                ),
            )
            for k, v in sorted(weekly_buckets.items())
        ]

        net_sentiment = NetSentimentData(
            score=round(pos_pct - neg_pct, 1),
            positive_pct=pos_pct,
            negative_pct=neg_pct,
            weekly=weekly_nss,
        )

        # 8. New vs returning — 30-day aggregate session counts
        nvr_daily = await self.analytics.get_new_vs_returning(org_id, days=30)
        new_total = sum(d["new_customers"] for d in nvr_daily)
        ret_total = sum(d["returning_customers"] for d in nvr_daily)
        nvr_grand = new_total + ret_total
        new_vs_returning = NewVsReturningData(
            new_customers=new_total,
            returning_customers=ret_total,
            total=nvr_grand,
            new_pct=round(new_total / max(nvr_grand, 1) * 100, 1),
            returning_pct=round(ret_total / max(nvr_grand, 1) * 100, 1),
        )

        result = DashboardSummaryResponse(
            revenue_trend=revenue_trend,
            top_products=top_products,
            compliance_alerts=compliance_alerts,
            churn_risk=churn_risk,
            pipeline_status=pipeline_status,
            funnel_health=funnel_health,
            net_sentiment=net_sentiment,
            new_vs_returning=new_vs_returning,
        )
        await self.cache.set(cache_key, result.model_dump(), ttl=TTL_DASHBOARD)
        return result

    async def delete_dashboard(self, org_id: str, dashboard_id: str) -> None:
        from datetime import datetime, timezone
        dash = await self._repo.get_by_id(dashboard_id)
        if not dash or dash.organization_id != org_id:
            raise NotFoundError("Dashboard not found")
        dash.deleted_at = datetime.now(timezone.utc)
