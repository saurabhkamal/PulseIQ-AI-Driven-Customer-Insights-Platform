from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from .base import TimestampMixin, new_uuid

if TYPE_CHECKING:
    from .organization import Organization

UserRoleEnum = Enum(
    "admin", "analyst", "marketer", "viewer",
    name="user_role",
)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_org", "organization_id"),
        Index("idx_users_email", "email"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(UserRoleEnum, nullable=False, default="viewer")
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    sso_provider: Mapped[str | None] = mapped_column(String(50))
    sso_subject: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users", lazy="noload")
    device_tokens: Mapped[list["DeviceToken"]] = relationship("DeviceToken", back_populates="user", lazy="noload")
    mobile_preferences: Mapped["MobilePreference | None"] = relationship(
        "MobilePreference", back_populates="user", uselist=False, lazy="noload"
    )
