from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

SentimentLabelEnum = Enum("positive", "neutral", "negative", name="sentiment_label")


class SentimentResult(Base):
    __tablename__ = "sentiment_results"
    __table_args__ = (
        UniqueConstraint("feedback_id"),
        Index("idx_sentiment_org", "organization_id"),
        Index("idx_sentiment_label", "organization_id", "sentiment"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    feedback_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("feedback.id", ondelete="CASCADE"), nullable=False
    )
    sentiment: Mapped[str] = mapped_column(SentimentLabelEnum, nullable=False)
    score: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
