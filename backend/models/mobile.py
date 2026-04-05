from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from .base import TimestampMixin, new_uuid

NotificationTypeEnum = Enum("insight", "trend", "pipeline", "system", name="notification_type")


class DeviceToken(Base, TimestampMixin):
    __tablename__ = "device_tokens"
    __table_args__ = (
        UniqueConstraint("user_id", "endpoint"),
        Index("idx_device_tokens_user", "user_id"),
        Index("idx_device_tokens_org", "organization_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    endpoint: Mapped[str] = mapped_column(String(1000), nullable=False)
    p256dh_key: Mapped[str] = mapped_column(String(500), nullable=False)
    auth_key: Mapped[str] = mapped_column(String(255), nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship("User", back_populates="device_tokens", lazy="noload")  # type: ignore[name-defined]


class MobileNotification(Base):
    __tablename__ = "mobile_notifications"
    __table_args__ = (
        Index("idx_notifications_user", "user_id", "sent_at"),
        Index("idx_notifications_org", "organization_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(NotificationTypeEnum, nullable=False)
    entity_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False))
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class MobilePreference(Base, TimestampMixin):
    __tablename__ = "mobile_preferences"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    push_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_on_insights: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_on_trends: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_on_pipeline: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pwa_installed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped["User"] = relationship("User", back_populates="mobile_preferences", lazy="noload")  # type: ignore[name-defined]
