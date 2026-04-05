from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from services.dashboard import DashboardService
from schemas.dashboard import DashboardCreate, DashboardUpdate, DashboardResponse
from schemas.analytics import KpiMetric
from schemas.common import PaginatedResponse

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("/kpi", response_model=list[KpiMetric])
async def get_kpi_metrics(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[KpiMetric]:
    return await DashboardService(db).get_kpi_metrics(current_user.org_id)


@router.get("", response_model=PaginatedResponse[DashboardResponse])
async def list_dashboards(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[DashboardResponse]:
    return await DashboardService(db).list_dashboards(current_user.org_id, page, page_size)


@router.post("", response_model=DashboardResponse, status_code=201)
async def create_dashboard(
    body: DashboardCreate,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardResponse:
    return await DashboardService(db).create_dashboard(current_user.org_id, body, current_user.user_id)


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: str,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardResponse:
    from core.exceptions import NotFoundError
    from repositories.base import BaseRepository
    from models.dashboard import Dashboard
    dash = await BaseRepository(Dashboard, db).get_by_id(dashboard_id)
    if not dash or dash.organization_id != current_user.org_id:
        raise NotFoundError("Dashboard not found")
    return DashboardResponse.model_validate(dash)


@router.patch("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: str,
    body: DashboardUpdate,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardResponse:
    return await DashboardService(db).update_dashboard(current_user.org_id, dashboard_id, body)


@router.delete("/{dashboard_id}", status_code=204)
async def delete_dashboard(
    dashboard_id: str,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await DashboardService(db).delete_dashboard(current_user.org_id, dashboard_id)
