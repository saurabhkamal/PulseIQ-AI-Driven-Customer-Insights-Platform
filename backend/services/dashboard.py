import hashlib
import json
import math

from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import get_cache, TTL_DASHBOARD
from core.exceptions import NotFoundError
from core.logging import get_logger
from repositories.analytics import AnalyticsRepository
from repositories.insights import InsightRepository
from repositories.trends import TrendRepository
from models.dashboard import Dashboard
from repositories.base import BaseRepository
from schemas.dashboard import DashboardCreate, DashboardUpdate, DashboardResponse
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

    async def delete_dashboard(self, org_id: str, dashboard_id: str) -> None:
        from datetime import datetime, timezone
        dash = await self._repo.get_by_id(dashboard_id)
        if not dash or dash.organization_id != org_id:
            raise NotFoundError("Dashboard not found")
        dash.deleted_at = datetime.now(timezone.utc)
