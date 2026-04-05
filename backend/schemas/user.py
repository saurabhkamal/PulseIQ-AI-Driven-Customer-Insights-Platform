from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr

UserRole = Literal["admin", "analyst", "marketer", "viewer"]


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = "viewer"


class UserUpdate(BaseModel):
    name: str | None = None
    role: UserRole | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    organization_id: str
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
