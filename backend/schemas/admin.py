from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class DataSourceCreate(BaseModel):
    name: str
    type: Literal["api_push", "csv_upload", "webhook"]
    config: dict[str, Any] = {}


class DataSourceUpdate(BaseModel):
    name: str | None = None
    status: Literal["active", "paused"] | None = None
    config: dict[str, Any] | None = None


class DataSourceResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    last_synced_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreate(BaseModel):
    name: str
    scopes: list[str] = []
    expires_at: datetime | None = None


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    scopes: list[str]
    is_active: bool
    last_used_at: datetime | None
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyResponse):
    """Returned only on creation — includes the raw key once."""
    raw_key: str


class AuditLogResponse(BaseModel):
    id: str
    user_id: str | None
    action: str
    entity_type: str | None
    entity_id: str | None
    ip_address: str | None
    metadata: dict[str, Any]
    occurred_at: datetime

    model_config = {"from_attributes": True}


class OrgSettingsUpdate(BaseModel):
    name: str | None = None
    settings: dict[str, Any] | None = None
