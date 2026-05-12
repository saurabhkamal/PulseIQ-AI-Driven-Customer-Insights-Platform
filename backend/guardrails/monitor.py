"""
Layer 6 — Guardrail Monitor
Persists the complete GuardrailContext to the ai_audit_logs table
after every analyst request — regardless of outcome.
This is the observability backbone; nothing is swallowed silently.
"""
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from models.ai_audit_log import AiAuditLog
from .context import GuardrailContext

logger = get_logger(__name__)


class GuardrailMonitor:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def log(self, ctx: GuardrailContext) -> None:
        """Persist the full audit context. Called at the end of every request."""
        try:
            entry = AiAuditLog(
                organization_id=ctx.org_id,
                user_id=ctx.user_id if ctx.user_id else None,
                session_id=ctx.session_id,
                feature=ctx.feature,

                user_input=ctx.user_input,
                sanitized_input=ctx.sanitized_input,

                pii_detected=ctx.pii_detected,
                pii_redacted_fields=ctx.pii_redacted_fields,
                prompt_injection_detected=ctx.prompt_injection_detected,
                injection_pattern_matched=ctx.injection_pattern_matched,
                input_classification=ctx.input_classification,

                policy_violations=ctx.policy_violations,
                policy_action=ctx.policy_action,

                system_prompt_version=ctx.system_prompt_version,
                system_prompt_hash=ctx.system_prompt_hash,

                tools_allowed=ctx.tools_allowed,
                tools_called=ctx.tools_called,
                tools_blocked=ctx.tools_blocked,
                tool_call_count=ctx.tool_call_count,
                tool_call_details=ctx.tool_call_details,

                model_used=ctx.model_used,
                prompt_tokens=ctx.prompt_tokens,
                completion_tokens=ctx.completion_tokens,
                latency_ms=ctx.latency_ms,
                llm_response_raw=ctx.llm_response_raw,

                output_pii_detected=ctx.output_pii_detected,
                output_pii_fields=ctx.output_pii_fields,
                hallucination_flags=ctx.hallucination_flags,
                hallucination_score=ctx.hallucination_score,
                content_filter_triggered=ctx.content_filter_triggered,
                content_filter_reason=ctx.content_filter_reason,
                final_response=ctx.final_response,

                guardrail_layer_triggered=ctx.guardrail_layer_triggered,
                overall_status=ctx.overall_status,
                error_message=ctx.error_message,

                created_at=ctx.created_at,
            )
            self._session.add(entry)
            await self._session.commit()

            logger.info(
                "guardrail_audit_logged",
                org_id=ctx.org_id,
                status=ctx.overall_status,
                layer=ctx.guardrail_layer_triggered,
                tool_calls=ctx.tool_call_count,
            )
        except Exception as exc:
            # Monitor must never raise — a logging failure must not break the user response
            logger.error("guardrail_monitor_failed", org_id=ctx.org_id, error=str(exc))
