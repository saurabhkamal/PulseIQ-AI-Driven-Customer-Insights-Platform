from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from services.mobile import MobileService
from services.dashboard import DashboardService
from services.insights import InsightsService
from schemas.mobile import DeviceTokenRequest, DeviceTokenResponse, NotificationResponse
from schemas.analytics import KpiMetric
from schemas.insights import InsightResponse

router = APIRouter(prefix="/mobile", tags=["mobile"])


@router.post("/device-tokens", response_model=DeviceTokenResponse, status_code=201)
async def register_device(
    body: DeviceTokenRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeviceTokenResponse:
    return await MobileService(db).register_device(
        current_user.user_id, current_user.org_id, body
    )


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NotificationResponse]:
    return await MobileService(db).get_notifications(current_user.user_id, current_user.org_id)


@router.post("/notifications/{notification_id}/read", status_code=204)
async def mark_notification_read(
    notification_id: str,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await MobileService(db).mark_notification_read(notification_id, current_user.user_id)


@router.get("/dashboard/summary")
async def get_mobile_dashboard(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Mobile-optimised dashboard summary — KPIs + top 3 insights."""
    metrics = await DashboardService(db).get_kpi_metrics(current_user.org_id)
    insights_page = await InsightsService(db).list_insights(
        current_user.org_id, page=1, page_size=3
    )
    return {
        "metrics": [m.model_dump() for m in metrics],
        "insights": [i.model_dump(mode="json") for i in insights_page.data],
    }
