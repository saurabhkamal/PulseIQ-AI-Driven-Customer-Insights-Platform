from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid

ComplianceSignalTypeEnum = Enum(
    "vulnerable_customer_cluster", "complaint_spike", "poor_outcome_indicator",
    "consumer_duty_alert", "tcf_breach_signal", "psd2_consent_issue", "none_detected",
    name="compliance_signal_type",
)

ComplianceSeverityEnum = Enum("high", "medium", "low", "none", name="compliance_severity")


class ComplianceSignal(Base):
    """
    Dedicated table for ComplianceSignalAgent outputs.
    Separate from the generic insights table so compliance teams can filter,
    audit, and export regulatory signals independently.
    Append-only — no UPDATE or DELETE (mirrors audit_logs pattern).
    """
    __tablename__ = "compliance_signals"
    __table_args__ = (
        Index("idx_compliance_org_date", "organization_id", "generated_at"),
        Index("idx_compliance_org_severity", "organization_id", "severity"),
        Index("idx_compliance_org_type", "organization_id", "signal_type"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    signal_type: Mapped[str] = mapped_column(ComplianceSignalTypeEnum, nullable=False)
    severity: Mapped[str] = mapped_column(ComplianceSeverityEnum, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    affected_population_estimate: Mapped[str | None] = mapped_column(String(255))
    recommended_review_action: Mapped[str] = mapped_column(Text, nullable=False)
    regulatory_reference: Mapped[str | None] = mapped_column(String(255))
    supporting_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    model_used: Mapped[str | None] = mapped_column(String(100))
    reviewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reviewed_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
