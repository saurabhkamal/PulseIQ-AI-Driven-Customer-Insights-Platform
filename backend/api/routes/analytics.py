from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from services.analytics import AnalyticsService
from services.dashboard import DashboardService
from schemas.analytics import BehaviorResponse, KpiMetric
from schemas.common import PaginatedResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/behavior", response_model=BehaviorResponse)
async def get_behavior(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
) -> BehaviorResponse:
    return await AnalyticsService(db).get_behavior(
        current_user.org_id, start_date, end_date
    )


@router.get("/trends")
async def get_trends(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    category: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    page: int = Query(default=1, ge=1),
):
    return await AnalyticsService(db).get_trends(
        current_user.org_id, category=category, limit=limit, page=page
    )


@router.get("/cohorts")
async def get_cohorts(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    cohort_by: str = Query(default="week"),
    metric: str = Query(default="retention"),
):
    return await AnalyticsService(db).get_cohorts(
        current_user.org_id, cohort_by=cohort_by, metric=metric
    )
