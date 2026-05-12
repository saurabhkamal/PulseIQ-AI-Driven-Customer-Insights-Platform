from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Numeric, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

FinancialProductTypeEnum = Enum(
    "current_account", "savings_account", "isa", "fixed_deposit",
    "personal_loan", "mortgage", "credit_card", "overdraft",
    "business_account", "subscription_free", "subscription_premium",
    "bnpl", "other",
    name="financial_product_type",
)


class FinancialProduct(Base):
    __tablename__ = "financial_products"
    __table_args__ = (
        UniqueConstraint("organization_id", "external_id"),
        Index("idx_fin_products_org", "organization_id"),
        Index("idx_fin_products_type", "organization_id", "product_type"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_type: Mapped[str] = mapped_column(FinancialProductTypeEnum, nullable=False)
    interest_rate_pct: Mapped[float | None] = mapped_column(Numeric(6, 4))
    credit_limit_gbp: Mapped[float | None] = mapped_column(Numeric(12, 2))
    term_months: Mapped[int | None] = mapped_column(SmallInteger)
    apr_pct: Mapped[float | None] = mapped_column(Numeric(6, 4))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    attributes: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
