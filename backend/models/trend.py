from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

SignalStrengthEnum = Enum("high", "medium", "low", name="signal_strength")


class TrendPrediction(Base):
    __tablename__ = "trend_predictions"
    __table_args__ = (Index("idx_trends_org_date", "organization_id", "generated_at"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(255))
    confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    signal_strength: Mapped[str] = mapped_column(SignalStrengthEnum, nullable=False)
    supporting_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    horizon_days: Mapped[int | None] = mapped_column(Integer)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
