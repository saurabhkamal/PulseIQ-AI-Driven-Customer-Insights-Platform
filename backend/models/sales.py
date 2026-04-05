from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid


class SaleData(Base):
    __tablename__ = "sales_data"
    __table_args__ = (
        UniqueConstraint("organization_id", "external_id"),
        Index("idx_sales_org_date", "organization_id", "transaction_at"),
        Index("idx_sales_product", "product_id"),
        Index("idx_sales_customer", "customer_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    product_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id"))
    customer_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    transaction_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
