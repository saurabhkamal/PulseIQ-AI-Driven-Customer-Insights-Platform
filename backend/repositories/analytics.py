from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, extract, text
from sqlalchemy.ext.asyncio import AsyncSession

from models.customer import Customer
from models.event import ConsumerEvent
from models.sales import SaleData
from models.product import Product

# Sector-specific funnel stage definitions.
# The active funnel is determined by which events are present in the org's data.
FUNNEL_STAGES: dict[str, list[str]] = {
    "retail_banking": [
        "onboarding_started",
        "kyc_completed",
        "account_opened",
    ],
    "fintech": [
        "onboarding_started",
        "kyc_completed",
        "feature_activated",
        "subscription_started",
    ],
    "ecommerce": [
        "view",
        "add_to_cart",
        "purchase",
    ],
}

# Default funnel used when sector cannot be inferred from event data.
DEFAULT_FUNNEL = FUNNEL_STAGES["retail_banking"]


class AnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_funnel(
        self,
        org_id: str,
        start: datetime,
        end: datetime,
        sector: str = "retail_banking",
    ) -> list[dict]:
        """Return event counts per funnel stage for the given sector."""
        stages = FUNNEL_STAGES.get(sector, DEFAULT_FUNNEL)
        result = await self.session.execute(
            select(
                ConsumerEvent.event_type,
                func.count(ConsumerEvent.id).label("count"),
            )
            .where(
                ConsumerEvent.organization_id == org_id,
                ConsumerEvent.occurred_at >= start,
                ConsumerEvent.occurred_at <= end,
                ConsumerEvent.event_type.in_(stages),
            )
            .group_by(ConsumerEvent.event_type)
        )
        rows = {r.event_type: r.count for r in result.all()}
        ordered = [(stage, rows.get(stage, 0)) for stage in stages]
        funnel = []
        for i, (stage, count) in enumerate(ordered):
            prev = ordered[i - 1][1] if i > 0 else count
            drop_off = round((1 - count / max(prev, 1)) * 100, 1) if i > 0 else 0.0
            funnel.append({"stage": stage, "count": count, "drop_off_pct": drop_off})
        return funnel

    async def get_top_products(
        self, org_id: str, start: datetime, end: datetime, limit: int = 5
    ) -> list[dict]:
        result = await self.session.execute(
            select(
                Product.id,
                Product.name,
                func.sum(SaleData.amount).label("revenue"),
                func.sum(SaleData.quantity).label("units"),
            )
            .join(SaleData, SaleData.product_id == Product.id)
            .where(
                SaleData.organization_id == org_id,
                SaleData.transaction_at >= start,
                SaleData.transaction_at <= end,
            )
            .group_by(Product.id, Product.name)
            .order_by(func.sum(SaleData.amount).desc())
            .limit(limit)
        )
        return [
            {"id": r.id, "name": r.name, "revenue": float(r.revenue or 0), "units": r.units}
            for r in result.all()
        ]

    async def get_heatmap(self, org_id: str) -> dict:
        """Return event counts grouped by day-of-week (0=Mon) and hour-of-day for the last 30 days."""
        since = datetime.now(timezone.utc) - timedelta(days=30)
        result = await self.session.execute(
            select(
                extract("isodow", ConsumerEvent.occurred_at).label("day"),
                extract("hour", ConsumerEvent.occurred_at).label("hour"),
                func.count(ConsumerEvent.id).label("value"),
            )
            .where(
                ConsumerEvent.organization_id == org_id,
                ConsumerEvent.occurred_at >= since,
            )
            .group_by("day", "hour")
        )
        cells = [
            {"day": int(r.day) - 1, "hour": int(r.hour), "value": r.value}
            for r in result.all()
        ]
        max_value = max((c["value"] for c in cells), default=0)
        return {"cells": cells, "max_value": max_value}

    async def get_cohort_retention(self, org_id: str, num_weeks: int = 6) -> dict:
        """
        Compute weekly cohort retention for the last `num_weeks` acquisition cohorts.

        Groups customers by the calendar week of their first event, then measures what
        percentage of each cohort was still active in each subsequent week.
        Returns data ready for CohortResponse serialisation.
        """
        cohort_start = (datetime.now(timezone.utc) - timedelta(weeks=num_weeks)).date()

        result = await self.session.execute(
            text("""
            WITH first_seen AS (
                SELECT
                    customer_id,
                    DATE_TRUNC('week', MIN(occurred_at))::DATE AS cohort_week
                FROM consumer_events
                WHERE organization_id = :org_id
                  AND customer_id IS NOT NULL
                GROUP BY customer_id
            ),
            recent_cohorts AS (
                SELECT * FROM first_seen
                WHERE cohort_week >= :cohort_start
            ),
            cohort_sizes AS (
                SELECT cohort_week, COUNT(*) AS cohort_size
                FROM recent_cohorts
                GROUP BY cohort_week
            ),
            weekly_activity AS (
                SELECT DISTINCT
                    rc.cohort_week,
                    DATE_TRUNC('week', ce.occurred_at)::DATE AS activity_week,
                    ce.customer_id
                FROM recent_cohorts rc
                JOIN consumer_events ce ON rc.customer_id = ce.customer_id
                WHERE ce.organization_id = :org_id
            ),
            weekly_counts AS (
                SELECT
                    cohort_week,
                    activity_week,
                    COUNT(DISTINCT customer_id) AS active_users
                FROM weekly_activity
                GROUP BY cohort_week, activity_week
            )
            SELECT
                wc.cohort_week,
                cs.cohort_size,
                wc.active_users,
                ROUND(wc.active_users * 100.0 / cs.cohort_size, 1) AS retention_pct,
                (wc.activity_week - wc.cohort_week) / 7 AS week_num
            FROM weekly_counts wc
            JOIN cohort_sizes cs ON wc.cohort_week = cs.cohort_week
            ORDER BY wc.cohort_week, week_num
            """),
            {"org_id": org_id, "cohort_start": cohort_start},
        )
        rows = result.all()
        return self._build_cohort_data(rows)

    @staticmethod
    def _build_cohort_data(rows: list) -> dict:
        cohorts: dict = {}
        for row in rows:
            key = row.cohort_week  # datetime.date
            if key not in cohorts:
                cohorts[key] = {"size": int(row.cohort_size), "by_week": {}}
            cohorts[key]["by_week"][int(row.week_num)] = float(row.retention_pct)

        if not cohorts:
            return {"cohort_by": "week", "metric": "retention", "data": []}

        max_week = max(wn for info in cohorts.values() for wn in info["by_week"])
        months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        data = []
        for week_date, info in sorted(cohorts.items()):
            label = f"{months[week_date.month]} {week_date.day}"
            retention = [info["by_week"].get(wn, 0.0) for wn in range(max_week + 1)]
            data.append({"cohort": label, "size": info["size"], "weeks": retention})

        return {"cohort_by": "week", "metric": "retention", "data": data}

    async def get_dau_trend(self, org_id: str, days: int = 30) -> list[dict]:
        """Return daily active user counts (distinct customer_id) for the last `days` days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.session.execute(
            select(
                func.date_trunc("day", ConsumerEvent.occurred_at).label("day"),
                func.count(func.distinct(ConsumerEvent.customer_id)).label("count"),
            )
            .where(
                ConsumerEvent.organization_id == org_id,
                ConsumerEvent.occurred_at >= since,
                ConsumerEvent.customer_id.is_not(None),
            )
            .group_by("day")
            .order_by("day")
        )
        return [
            {"date": r.day.date().isoformat(), "count": r.count}
            for r in result.all()
        ]

    async def get_new_vs_returning(self, org_id: str, days: int = 30) -> list[dict]:
        """Return daily new vs returning customer counts for the last `days` days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.session.execute(
            text("""
            WITH first_events AS (
                SELECT customer_id, MIN(occurred_at) AS first_seen
                FROM consumer_events
                WHERE organization_id = :org_id AND customer_id IS NOT NULL
                GROUP BY customer_id
            ),
            daily AS (
                SELECT
                    DATE_TRUNC('day', ce.occurred_at)::DATE AS day,
                    ce.customer_id,
                    CASE WHEN fe.first_seen >= :since THEN 'new' ELSE 'returning' END AS ctype
                FROM consumer_events ce
                JOIN first_events fe ON ce.customer_id = fe.customer_id
                WHERE ce.organization_id = :org_id
                  AND ce.occurred_at >= :since
                  AND ce.customer_id IS NOT NULL
            )
            SELECT
                day,
                COUNT(DISTINCT CASE WHEN ctype = 'new' THEN customer_id END) AS new_customers,
                COUNT(DISTINCT CASE WHEN ctype = 'returning' THEN customer_id END) AS returning_customers
            FROM daily
            GROUP BY day
            ORDER BY day
            """),
            {"org_id": org_id, "since": since},
        )
        return [
            {
                "date": r.day.isoformat(),
                "new_customers": r.new_customers or 0,
                "returning_customers": r.returning_customers or 0,
            }
            for r in result.all()
        ]

    async def get_segment_engagement(self, org_id: str) -> list[dict]:
        """Return event count and customer count per customer segment for last 30 days."""
        since = datetime.now(timezone.utc) - timedelta(days=30)
        result = await self.session.execute(
            select(
                Customer.segment,
                func.count(ConsumerEvent.id).label("event_count"),
                func.count(func.distinct(ConsumerEvent.customer_id)).label("customer_count"),
            )
            .join(ConsumerEvent, ConsumerEvent.customer_id == Customer.id)
            .where(
                Customer.organization_id == org_id,
                ConsumerEvent.organization_id == org_id,
                ConsumerEvent.occurred_at >= since,
                Customer.segment.is_not(None),
            )
            .group_by(Customer.segment)
            .order_by(func.count(ConsumerEvent.id).desc())
        )
        rows = result.all()
        if not rows:
            return []
        max_events = max(r.event_count for r in rows)
        return [
            {
                "segment": r.segment,
                "event_count": r.event_count,
                "customer_count": r.customer_count,
                "engagement_score": round(r.event_count / max(max_events, 1) * 100, 1),
            }
            for r in rows
        ]

    async def get_product_revenue_trend(
        self, org_id: str, days: int = 30, limit: int = 5
    ) -> list[dict]:
        """Return daily revenue per top-N products over the last `days` days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        top_result = await self.session.execute(
            select(
                Product.id,
                Product.name,
                func.sum(SaleData.amount).label("total"),
            )
            .join(SaleData, SaleData.product_id == Product.id)
            .where(
                SaleData.organization_id == org_id,
                SaleData.transaction_at >= since,
                Product.id.is_not(None),
            )
            .group_by(Product.id, Product.name)
            .order_by(func.sum(SaleData.amount).desc())
            .limit(limit)
        )
        top_products = top_result.all()
        if not top_products:
            return []

        product_ids = [p.id for p in top_products]
        product_names = {p.id: p.name for p in top_products}

        trend_result = await self.session.execute(
            select(
                SaleData.product_id,
                func.date_trunc("day", SaleData.transaction_at).label("day"),
                func.sum(SaleData.amount).label("revenue"),
            )
            .where(
                SaleData.organization_id == org_id,
                SaleData.transaction_at >= since,
                SaleData.product_id.in_(product_ids),
            )
            .group_by(SaleData.product_id, "day")
            .order_by("day")
        )

        products: dict[str, dict] = {
            pid: {"id": pid, "name": product_names[pid], "days": []}
            for pid in product_ids
        }
        for r in trend_result.all():
            products[r.product_id]["days"].append(
                {"date": r.day.date().isoformat(), "revenue": float(r.revenue or 0)}
            )

        return list(products.values())

    async def get_revenue_trend(self, org_id: str, days: int = 30) -> list[dict]:
        """Return daily total transaction revenue for the last `days` days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.session.execute(
            select(
                func.date_trunc("day", SaleData.transaction_at).label("day"),
                func.sum(SaleData.amount).label("revenue"),
            )
            .where(
                SaleData.organization_id == org_id,
                SaleData.transaction_at >= since,
            )
            .group_by("day")
            .order_by("day")
        )
        return [
            {"date": r.day.date().isoformat(), "revenue": float(r.revenue or 0)}
            for r in result.all()
        ]

    async def get_kpi_metrics(self, org_id: str) -> list[dict]:
        """Return key KPI metrics for the dashboard."""
        from datetime import timedelta, timezone

        now = datetime.now(timezone.utc)
        start_current = now - timedelta(days=30)
        start_prev = now - timedelta(days=60)

        async def revenue(start: datetime, end: datetime) -> float:
            r = await self.session.execute(
                select(func.sum(SaleData.amount)).where(
                    SaleData.organization_id == org_id,
                    SaleData.transaction_at >= start,
                    SaleData.transaction_at <= end,
                )
            )
            return float(r.scalar_one() or 0)

        async def order_count(start: datetime, end: datetime) -> int:
            r = await self.session.execute(
                select(func.count(SaleData.id)).where(
                    SaleData.organization_id == org_id,
                    SaleData.transaction_at >= start,
                    SaleData.transaction_at <= end,
                )
            )
            return r.scalar_one() or 0

        rev_curr = await revenue(start_current, now)
        rev_prev = await revenue(start_prev, start_current)
        orders_curr = await order_count(start_current, now)
        orders_prev = await order_count(start_prev, start_current)

        def trend(curr: float, prev: float) -> tuple[str, str]:
            if prev == 0:
                return "flat", "—"
            pct = ((curr - prev) / prev) * 100
            if pct > 0:
                return "up", f"+{pct:.1f}%"
            if pct < 0:
                return "down", f"{pct:.1f}%"
            return "flat", "0%"

        rev_trend, rev_trend_val = trend(rev_curr, rev_prev)
        ord_trend, ord_trend_val = trend(orders_curr, orders_prev)

        return [
            {
                "id": "revenue",
                "label": "Transaction Volume (30d)",
                "value": rev_curr,
                "formatted_value": f"£{rev_curr:,.0f}",
                "trend": rev_trend,
                "trend_value": rev_trend_val,
            },
            {
                "id": "orders",
                "label": "Applications (30d)",
                "value": float(orders_curr),
                "formatted_value": f"{orders_curr:,}",
                "trend": ord_trend,
                "trend_value": ord_trend_val,
            },
        ]
