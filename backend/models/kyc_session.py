from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

KycStatusEnum = Enum(
    "initiated", "in_progress", "completed", "failed", "expired", "abandoned",
    name="kyc_status",
)

KycDocumentTypeEnum = Enum(
    "passport", "driving_licence", "national_id", "utility_bill",
    "bank_statement", "proof_of_address", "selfie", "other",
    name="kyc_document_type",
)


class KycSession(Base):
    """Tracks each KYC verification attempt with structured failure reasons for abandonment analysis."""
    __tablename__ = "kyc_sessions"
    __table_args__ = (
        Index("idx_kyc_org_customer", "organization_id", "customer_id"),
        Index("idx_kyc_org_status", "organization_id", "status"),
        Index("idx_kyc_org_date", "organization_id", "initiated_at"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    customer_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"))
    external_session_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(KycStatusEnum, nullable=False, default="initiated")
    document_type: Mapped[str | None] = mapped_column(KycDocumentTypeEnum)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    failure_reason: Mapped[str | None] = mapped_column(String(500))
    failure_code: Mapped[str | None] = mapped_column(String(100))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    drop_off_step: Mapped[str | None] = mapped_column(String(100))
    provider: Mapped[str | None] = mapped_column(String(100))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    initiated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
