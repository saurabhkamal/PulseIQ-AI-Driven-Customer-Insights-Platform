from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, SmallInteger, Text, UniqueConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

FeedbackSourceEnum = Enum("website", "email", "survey", "app", "other", name="feedback_source")


class Feedback(Base):
    __tablename__ = "feedback"
    __table_args__ = (
        UniqueConstraint("organization_id", "external_id"),
        Index("idx_feedback_org", "organization_id"),
        Index("idx_feedback_product", "product_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[str | None] = mapped_column(String(255))
    customer_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"))
    product_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id"))
    text: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int | None] = mapped_column(SmallInteger)
    source: Mapped[str] = mapped_column(FeedbackSourceEnum, nullable=False, default="website")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
