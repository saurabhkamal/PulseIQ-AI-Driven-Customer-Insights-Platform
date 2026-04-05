from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class DeviceTokenRequest(BaseModel):
    endpoint: str
    keys: dict[str, str]   # p256dh, auth
    device_id: str | None = None


class DeviceTokenResponse(BaseModel):
    id: str
    registered_at: datetime


class NotificationResponse(BaseModel):
    id: str
    title: str
    body: str
    type: Literal["insight", "trend", "pipeline", "system"]
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
