"""
Compliance signal endpoints — Admin and Analyst only.
  GET /api/v1/compliance/signals — paginated list of regulatory signals
"""
import math
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import CurrentUser, require_analyst_or_above
from models.compliance_signal import ComplianceSignal
from repositories.base import BaseRepository
from schemas.common import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/compliance", tags=["compliance"])

AnalystOrAboveUser = Annotated[CurrentUser, Depends(require_analyst_or_above)]


class ComplianceSignalResponse(BaseModel):
    id: str
    signal_type: str
    severity: str
    description: str
    affected_population_estimate: str | None
    recommended_review_action: str
    regulatory_reference: str | None
    reviewed: bool
    reviewed_at: datetime | None
    generated_at: datetime

    model_config = {"from_attributes": True}


@router.get("/signals", response_model=PaginatedResponse[ComplianceSignalResponse])
async def list_compliance_signals(
    current_user: AnalystOrAboveUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    severity: str | None = Query(default=None),
    reviewed: bool | None = Query(default=None),
) -> PaginatedResponse[ComplianceSignalResponse]:
    repo = BaseRepository(ComplianceSignal, db)

    filters = [ComplianceSignal.organization_id == current_user.org_id]
    if severity:
        filters.append(ComplianceSignal.severity == severity)
    if reviewed is not None:
        filters.append(ComplianceSignal.reviewed == reviewed)

    rows, total = await repo.list(
        *filters,
        offset=(page - 1) * page_size,
        limit=page_size,
        order_by=ComplianceSignal.generated_at.desc(),
    )

    return PaginatedResponse(
        data=[ComplianceSignalResponse.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=math.ceil(total / page_size) if total else 1,
        ),
    )
