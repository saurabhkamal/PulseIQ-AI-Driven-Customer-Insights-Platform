from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from .base import TimestampMixin, new_uuid

SourceTypeEnum = Enum("api_push", "csv_upload", "webhook", name="source_type")
SourceStatusEnum = Enum("active", "paused", "error", name="source_status")


class DataSource(Base, TimestampMixin):
    __tablename__ = "data_sources"
    __table_args__ = (Index("idx_data_sources_org", "organization_id"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(SourceTypeEnum, nullable=False)
    status: Mapped[str] = mapped_column(SourceStatusEnum, nullable=False, default="active")
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship("Organization", back_populates="data_sources", lazy="noload")  # type: ignore[name-defined]
