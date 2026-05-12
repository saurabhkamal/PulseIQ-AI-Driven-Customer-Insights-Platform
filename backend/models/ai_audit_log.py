from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from .base import new_uuid


class AiAuditLog(Base):
    """
    Append-only monitoring table for every AI analyst request.
    Records what each guardrail layer detected, allowed, or blocked —
    providing a full audit trail for compliance and operational review.
    No UPDATE or DELETE via RLS policy (mirrors audit_logs pattern).
    """
    __tablename__ = "ai_audit_logs"
    __table_args__ = (
        Index("idx_ai_audit_org_created", "organization_id", "created_at"),
        Index("idx_ai_audit_org_status", "organization_id", "overall_status"),
        Index("idx_ai_audit_user", "user_id", "created_at"),
        Index("idx_ai_audit_session", "session_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)

    # ── Identity ─────────────────────────────────────────────────────────
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(String(128))
    feature: Mapped[str] = mapped_column(String(64), nullable=False, default="analyst")

    # ── Raw input ─────────────────────────────────────────────────────────
    user_input: Mapped[str] = mapped_column(Text, nullable=False)
    sanitized_input: Mapped[str | None] = mapped_column(Text)

    # ── Input guardrail layer results ─────────────────────────────────────
    pii_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pii_redacted_fields: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    prompt_injection_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    injection_pattern_matched: Mapped[str | None] = mapped_column(String(255))
    input_classification: Mapped[str | None] = mapped_column(String(64))

    # ── Policy guardrail layer results ────────────────────────────────────
    policy_violations: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    policy_action: Mapped[str | None] = mapped_column(String(32))

    # ── Instruction layer ─────────────────────────────────────────────────
    system_prompt_version: Mapped[str | None] = mapped_column(String(64))
    system_prompt_hash: Mapped[str | None] = mapped_column(String(64))

    # ── Execution guardrail layer results ─────────────────────────────────
    tools_allowed: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    tools_called: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    tools_blocked: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    tool_call_count: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    tool_call_details: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # ── LLM call ─────────────────────────────────────────────────────────
    model_used: Mapped[str | None] = mapped_column(String(64))
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    llm_response_raw: Mapped[str | None] = mapped_column(Text)

    # ── Output guardrail layer results ────────────────────────────────────
    output_pii_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    output_pii_fields: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    hallucination_flags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    hallucination_score: Mapped[float | None] = mapped_column(Float)
    content_filter_triggered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    content_filter_reason: Mapped[str | None] = mapped_column(String(255))

    # ── Final response ────────────────────────────────────────────────────
    final_response: Mapped[str | None] = mapped_column(Text)

    # ── Overall outcome ───────────────────────────────────────────────────
    guardrail_layer_triggered: Mapped[str | None] = mapped_column(String(32))
    overall_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="completed"
    )
    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
