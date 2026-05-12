from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.auth import AuthService
from repositories.audit import AuditRepository
from schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from api.dependencies.rate_limit import rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])

_login_limit = rate_limit(max_requests=5, window_seconds=60)


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    return await AuthService(db).register(body)


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(_login_limit)])
async def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    result = await AuthService(db).login(body.email, body.password)
    await AuditRepository(db).log(
        org_id=result.user.organization_id,
        action="user.login",
        user_id=result.user.id,
        entity_type="user",
        entity_id=result.user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    return await AuthService(db).refresh(body.refresh_token)


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    # Stateless JWT — invalidation is client-side.
    # Log the event for SMCR audit trail.
    user_id = request.headers.get("x-user-id")
    org_id = request.headers.get("x-org-id")
    if user_id and org_id:
        await AuditRepository(db).log(
            org_id=org_id,
            action="user.logout",
            user_id=user_id,
            entity_type="user",
            entity_id=user_id,
            ip_address=request.client.host if request.client else None,
        )
    return None
