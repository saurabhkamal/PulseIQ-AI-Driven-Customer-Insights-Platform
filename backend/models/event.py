from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

EventTypeEnum = Enum(
    "view", "click", "add_to_cart", "remove_from_cart",
    "purchase", "review", "search", "other",
    name="event_type",
)


class ConsumerEvent(Base):
    __tablename__ = "consumer_events"
    __table_args__ = (
        Index("idx_events_org_date", "organization_id", "occurred_at"),
        Index("idx_events_customer", "customer_id"),
        Index("idx_events_product", "product_id"),
        Index("idx_events_type", "organization_id", "event_type"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[str | None] = mapped_column(String(255))
    customer_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"))
    product_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id"))
    event_type: Mapped[str] = mapped_column(EventTypeEnum, nullable=False)
    properties: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
