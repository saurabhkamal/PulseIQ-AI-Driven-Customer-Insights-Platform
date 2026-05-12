"""
GDPR compliance endpoints.
  POST /api/v1/gdpr/delete-request  — right to erasure (Article 17)
  GET  /api/v1/gdpr/my-data         — data subject access request (Article 15)
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from repositories.audit import AuditRepository

router = APIRouter(prefix="/gdpr", tags=["gdpr"])


class DeletionRequestBody(BaseModel):
    reason: str | None = None


class DeletionRequestResponse(BaseModel):
    request_id: str
    status: str
    message: str
    requested_at: datetime


class MyDataResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    organization_id: str
    created_at: datetime | None
    last_login_at: datetime | None
    audit_events: list[dict]
    export_generated_at: datetime


@router.post("/delete-request", response_model=DeletionRequestResponse, status_code=202)
async def request_deletion(
    body: DeletionRequestBody,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeletionRequestResponse:
    """Submit a right-to-erasure request (GDPR Article 17). Processed within 30 days."""
    result = await db.execute(
        text("""
            INSERT INTO gdpr_deletion_requests
                (organization_id, user_id, requested_by, status, reason, requested_at, created_at)
            VALUES
                (:org_id, :user_id, :requested_by, 'pending', :reason, NOW(), NOW())
            RETURNING id, requested_at
        """),
        {
            "org_id": current_user.org_id,
            "user_id": current_user.user_id,
            "requested_by": current_user.user_id,
            "reason": body.reason,
        },
    )
    row = result.fetchone()
    await db.commit()

    await AuditRepository(db).log(
        org_id=current_user.org_id,
        action="gdpr.deletion_requested",
        user_id=current_user.user_id,
        entity_type="user",
        entity_id=current_user.user_id,
        metadata={"reason": body.reason},
    )

    return DeletionRequestResponse(
        request_id=str(row.id),
        status="pending",
        message="Your deletion request has been received and will be processed within 30 days in accordance with UK GDPR Article 17.",
        requested_at=row.requested_at,
    )


@router.get("/my-data", response_model=MyDataResponse)
async def get_my_data(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MyDataResponse:
    """Export all personal data held for the requesting user (GDPR Article 15 DSAR)."""
    user_row = await db.execute(
        text("SELECT id, email, name, role, organization_id, created_at, last_login_at FROM users WHERE id = :id"),
        {"id": current_user.user_id},
    )
    user = user_row.fetchone()

    audit_rows = await db.execute(
        text("""
            SELECT action, entity_type, entity_id, ip_address, occurred_at
            FROM audit_logs
            WHERE user_id = :uid
            ORDER BY occurred_at DESC
            LIMIT 100
        """),
        {"uid": current_user.user_id},
    )
    audit_events = [
        {
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "ip_address": r.ip_address,
            "occurred_at": str(r.occurred_at),
        }
        for r in audit_rows.fetchall()
    ]

    await AuditRepository(db).log(
        org_id=current_user.org_id,
        action="gdpr.data_export_requested",
        user_id=current_user.user_id,
        entity_type="user",
        entity_id=current_user.user_id,
    )

    return MyDataResponse(
        user_id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        organization_id=str(user.organization_id),
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        audit_events=audit_events,
        export_generated_at=datetime.now(timezone.utc),
    )
