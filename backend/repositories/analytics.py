from datetime import datetime

from sqlalchemy import select, func, case
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
