import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import require_roles, AnyUser
from core.exceptions import ForbiddenError
from schemas.export import ExportRequest, ExportResponse

router = APIRouter(prefix="/export", tags=["export"])

_EXPORT_ROLES = ("admin", "analyst", "marketer")


@router.post("/report", response_model=ExportResponse, status_code=202)
async def create_export(
    body: ExportRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ExportResponse:
    if current_user.role not in _EXPORT_ROLES:
        raise ForbiddenError("Export requires Analyst, Marketer, or Admin role")
    export_id = str(uuid.uuid4())
    return ExportResponse(export_id=export_id, status="processing", download_url=None)


@router.get("/{export_id}", response_model=ExportResponse)
async def get_export(
    export_id: str,
    current_user: AnyUser,
) -> ExportResponse:
    # In production: look up export job status from ElastiCache / S3
    return ExportResponse(export_id=export_id, status="processing", download_url=None)
