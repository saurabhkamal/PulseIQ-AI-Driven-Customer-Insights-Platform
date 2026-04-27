from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from models.event import ConsumerEvent
from models.sales import SaleData
from models.product import Product


class AnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_funnel(
        self, org_id: str, start: datetime, end: datetime
    ) -> list[dict]:
        """Return event counts per stage within the date range."""
        result = await self.session.execute(
            select(
                ConsumerEvent.event_type,
                func.count(ConsumerEvent.id).label("count"),
            )
            .where(
                ConsumerEvent.organization_id == org_id,
                ConsumerEvent.occurred_at >= start,
                ConsumerEvent.occurred_at <= end,
                ConsumerEvent.event_type.in_(["view", "add_to_cart", "purchase"]),
            )
            .group_by(ConsumerEvent.event_type)
        )
        rows = {r.event_type: r.count for r in result.all()}
        stages = [
            ("view", rows.get("view", 0)),
            ("add_to_cart", rows.get("add_to_cart", 0)),
            ("purchase", rows.get("purchase", 0)),
        ]
        funnel = []
        for i, (stage, count) in enumerate(stages):
            prev = stages[i - 1][1] if i > 0 else count
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

    async def get_heatmap(
        self, org_id: str, days: int = 90
    ) -> list[dict]:
        """Return event counts grouped by day-of-week (0=Mon) and hour (0-23)."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        sql = text("""
            SELECT
                CAST(((EXTRACT(DOW FROM occurred_at)::int + 6) % 7) AS INTEGER) AS day,
                CAST(EXTRACT(HOUR FROM occurred_at) AS INTEGER)                  AS hour,
                COUNT(*)::integer                                                 AS value
            FROM consumer_events
            WHERE organization_id = :org_id
              AND occurred_at >= :since
            GROUP BY
                CAST(((EXTRACT(DOW FROM occurred_at)::int + 6) % 7) AS INTEGER),
                CAST(EXTRACT(HOUR FROM occurred_at) AS INTEGER)
            ORDER BY day, hour
        """)
        result = await self.session.execute(sql, {"org_id": org_id, "since": since})
        return [{"day": int(r.day), "hour": int(r.hour), "value": int(r.value)} for r in result.mappings().all()]

    async def get_cohorts(
        self, org_id: str, max_cohorts: int = 8, max_weeks: int = 7
    ) -> list[dict]:
        """
        Return cohort retention data.
        Each row: { cohort: str, size: int, retention: [100.0, 72.5, ...] }
        retention[0] is always 100 (week 0 = acquisition week).
        """
        sql = text("""
            WITH first_activity AS (
                SELECT
                    customer_id,
                    DATE_TRUNC('week', MIN(occurred_at)) AS cohort_week
                FROM consumer_events
                WHERE organization_id = :org_id
                  AND customer_id IS NOT NULL
                GROUP BY customer_id
            ),
            weekly_activity AS (
                SELECT
                    e.customer_id,
                    fa.cohort_week,
                    DATE_TRUNC('week', e.occurred_at) AS event_week
                FROM consumer_events e
                INNER JOIN first_activity fa ON e.customer_id = fa.customer_id
                WHERE e.organization_id = :org_id
                  AND e.customer_id IS NOT NULL
                GROUP BY e.customer_id, fa.cohort_week, DATE_TRUNC('week', e.occurred_at)
            ),
            retention_raw AS (
                SELECT
                    cohort_week,
                    CAST(EXTRACT(EPOCH FROM (event_week - cohort_week)) / 604800 AS INTEGER) AS week_num,
                    COUNT(DISTINCT customer_id) AS retained
                FROM weekly_activity
                GROUP BY cohort_week, CAST(EXTRACT(EPOCH FROM (event_week - cohort_week)) / 604800 AS INTEGER)
            ),
            cohort_sizes AS (
                SELECT cohort_week, COUNT(DISTINCT customer_id) AS cohort_size
                FROM first_activity
                GROUP BY cohort_week
            ),
            recent_cohorts AS (
                SELECT cohort_week
                FROM cohort_sizes
                ORDER BY cohort_week DESC
                LIMIT :max_cohorts
            )
            SELECT
                TO_CHAR(r.cohort_week, 'YYYY-"W"IW') AS cohort,
                cs.cohort_size                         AS size,
                r.week_num,
                r.retained
            FROM retention_raw r
            INNER JOIN cohort_sizes cs  ON cs.cohort_week = r.cohort_week
            INNER JOIN recent_cohorts rc ON rc.cohort_week = r.cohort_week
            WHERE r.week_num >= 0 AND r.week_num <= :max_weeks
            ORDER BY r.cohort_week DESC, r.week_num
        """)
        result = await self.session.execute(
            sql,
            {"org_id": org_id, "max_cohorts": max_cohorts, "max_weeks": max_weeks},
        )
        rows = result.mappings().all()

        # Pivot: group by cohort, build retention array indexed by week_num
        cohorts: dict[str, dict] = {}
        for r in rows:
            key = r["cohort"]
            if key not in cohorts:
                cohorts[key] = {"cohort": key, "size": int(r["size"]), "slots": {}}
            cohorts[key]["slots"][int(r["week_num"])] = int(r["retained"])

        output = []
        for c in cohorts.values():
            size = c["size"]
            slots: dict[int, int] = c["slots"]
            num_weeks = max(slots.keys(), default=0) + 1
            retention = []
            for wi in range(num_weeks):
                retained = slots.get(wi, 0)
                retention.append(round((retained / size) * 100, 1) if size > 0 else 0.0)
            output.append({"cohort": c["cohort"], "size": size, "retention": retention})

        return output

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
                "label": "Revenue (30d)",
                "value": rev_curr,
                "formatted_value": f"${rev_curr:,.0f}",
                "trend": rev_trend,
                "trend_value": rev_trend_val,
            },
            {
                "id": "orders",
                "label": "Orders (30d)",
                "value": float(orders_curr),
                "formatted_value": f"{orders_curr:,}",
                "trend": ord_trend,
                "trend_value": ord_trend_val,
            },
        ]
