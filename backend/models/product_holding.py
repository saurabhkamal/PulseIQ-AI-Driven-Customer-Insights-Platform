from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

HoldingStatusEnum = Enum("active", "closed", "suspended", "pending", name="holding_status")


class ProductHolding(Base):
    """Records which customer holds which financial product — essential for cross-sell analysis."""
    __tablename__ = "product_holdings"
    __table_args__ = (
        UniqueConstraint("organization_id", "customer_id", "financial_product_id"),
        Index("idx_holdings_org_customer", "organization_id", "customer_id"),
        Index("idx_holdings_org_product", "organization_id", "financial_product_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    financial_product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("financial_products.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(HoldingStatusEnum, nullable=False, default="active")
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
