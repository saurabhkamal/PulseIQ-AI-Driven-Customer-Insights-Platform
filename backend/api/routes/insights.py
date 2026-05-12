from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from services.insights import InsightsService
from schemas.insights import InsightResponse
from schemas.common import PaginatedResponse, JobResponse

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/summary")
async def get_insights_summary(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await InsightsService(db).get_summary(current_user.org_id)


@router.get("", response_model=PaginatedResponse[InsightResponse])
async def list_insights(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    type: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
) -> PaginatedResponse[InsightResponse]:
    return await InsightsService(db).list_insights(
        current_user.org_id, insight_type=type, priority=priority, page=page, page_size=limit
    )


@router.post("/refresh", response_model=JobResponse, status_code=202)
async def refresh_insights(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobResponse:
    return await InsightsService(db).trigger_refresh(current_user.org_id)
