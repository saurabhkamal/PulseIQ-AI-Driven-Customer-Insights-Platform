"""Admin-only endpoints for data sources, API keys, and audit logs."""
import hashlib
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import NotFoundError
from api.dependencies import AdminUser
from repositories.audit import AuditRepository
from models.api_key import ApiKey
from models.data_source import DataSource
from repositories.base import BaseRepository
from schemas.admin import (
    DataSourceCreate, DataSourceUpdate, DataSourceResponse,
    ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse,
    AuditLogResponse, OrgSettingsUpdate,
)
from schemas.common import PaginatedResponse, PaginationMeta
import math

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Data Sources ──────────────────────────────────────────────────────────────

@router.get("/data-sources", response_model=list[DataSourceResponse])
async def list_data_sources(
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[DataSourceResponse]:
    repo = BaseRepository(DataSource, db)
    rows, _ = await repo.list(
        DataSource.organization_id == current_user.org_id,
        limit=100,
        order_by=DataSource.created_at.desc(),
    )
    return [DataSourceResponse.model_validate(r) for r in rows]


@router.post("/data-sources", response_model=DataSourceResponse, status_code=201)
async def create_data_source(
    body: DataSourceCreate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DataSourceResponse:
    ds = DataSource(
        organization_id=current_user.org_id,
        name=body.name,
        type=body.type,
        config=body.config,
    )
    repo = BaseRepository(DataSource, db)
    ds = await repo.create(ds)
    return DataSourceResponse.model_validate(ds)


@router.patch("/data-sources/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: str,
    body: DataSourceUpdate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DataSourceResponse:
    repo = BaseRepository(DataSource, db)
    ds = await repo.get_by_id(source_id)
    if not ds or ds.organization_id != current_user.org_id:
        raise NotFoundError("Data source not found")
    if body.name:
        ds.name = body.name
    if body.status:
        ds.status = body.status
    if body.config is not None:
        ds.config = body.config
    return DataSourceResponse.model_validate(ds)


# ── API Keys ──────────────────────────────────────────────────────────────────

@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ApiKeyResponse]:
    repo = BaseRepository(ApiKey, db)
    rows, _ = await repo.list(
        ApiKey.organization_id == current_user.org_id,
        ApiKey.is_active == True,  # noqa: E712
        limit=100,
        order_by=ApiKey.created_at.desc(),
    )
    return [ApiKeyResponse.model_validate(r) for r in rows]


@router.post("/api-keys", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    body: ApiKeyCreate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiKeyCreatedResponse:
    raw_key = f"piq_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:8]

    key = ApiKey(
        organization_id=current_user.org_id,
        name=body.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        scopes=body.scopes,
        expires_at=body.expires_at,
        created_by=current_user.user_id,
    )
    repo = BaseRepository(ApiKey, db)
    key = await repo.create(key)
    resp = ApiKeyCreatedResponse.model_validate(key)
    resp = resp.model_copy(update={"raw_key": raw_key})
    return resp


@router.delete("/api-keys/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: str,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    repo = BaseRepository(ApiKey, db)
    key = await repo.get_by_id(key_id)
    if not key or key.organization_id != current_user.org_id:
        raise NotFoundError("API key not found")
    key.is_active = False


# ── Audit Logs ────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogResponse])
async def get_audit_logs(
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> PaginatedResponse[AuditLogResponse]:
    repo = AuditRepository(db)
    offset = (page - 1) * page_size
    rows, total = await repo.get_by_org(current_user.org_id, offset=offset, limit=page_size)
    return PaginatedResponse(
        data=[AuditLogResponse.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page, page_size=page_size, total=total,
            total_pages=math.ceil(total / page_size),
        ),
    )
