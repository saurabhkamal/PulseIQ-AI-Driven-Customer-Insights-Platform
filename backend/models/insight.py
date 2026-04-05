from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

InsightTypeEnum = Enum("marketing", "sales", "product", "retention", name="insight_type")
InsightPriorityEnum = Enum("high", "medium", "low", name="insight_priority")


class Insight(Base):
    __tablename__ = "insights"
    __table_args__ = (
        Index("idx_insights_org_type", "organization_id", "type"),
        Index("idx_insights_org_date", "organization_id", "generated_at"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(InsightTypeEnum, nullable=False)
    priority: Mapped[str] = mapped_column(InsightPriorityEnum, nullable=False, default="medium")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    source_agent: Mapped[str | None] = mapped_column(String(100))
    model_used: Mapped[str | None] = mapped_column(String(100))
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
