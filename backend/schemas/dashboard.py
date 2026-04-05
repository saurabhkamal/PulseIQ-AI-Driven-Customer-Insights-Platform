from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DashboardCreate(BaseModel):
    name: str
    description: str | None = None
    layout: dict[str, Any] = {}
    widgets: list[dict[str, Any]] = []


class DashboardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    layout: dict[str, Any] | None = None
    widgets: list[dict[str, Any]] | None = None


class DashboardResponse(BaseModel):
    id: str
    organization_id: str
    created_by: str | None
    name: str
    description: str | None
    layout: dict[str, Any]
    widgets: list[dict[str, Any]]
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
