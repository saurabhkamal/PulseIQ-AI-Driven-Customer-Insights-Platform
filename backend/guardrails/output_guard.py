"""
Layer 5 — Output Guard
Scans the LLM's response for PII leakage, low-confidence hallucination signals,
and prohibited content before it reaches the user.
"""
import re

from core.logging import get_logger
from .context import GuardrailContext

logger = get_logger(__name__)

# Reuse the same PII patterns from input_guard (import avoids duplication)
from .input_guard import _PII_PATTERNS

# Phrases that indicate the model may be hallucinating or speculating
_HALLUCINATION_INDICATORS: list[tuple[str, str]] = [
    ("fabricated_percentage", re.compile(r"\b(exactly|precisely)\s+\d+(\.\d+)?\s*%", re.IGNORECASE)),
    ("ungrounded_claim", re.compile(r"\b(I\s+believe|I\s+think|I\s+assume|probably|likely|might\s+be)\b.*\d", re.IGNORECASE)),
    ("impossible_precision", re.compile(r"\b\d{5,}\s*(customers?|users?|accounts?)\b", re.IGNORECASE)),
]

# Phrases that should never appear in analyst output
_PROHIBITED_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("system_prompt_leak", re.compile(r"(SCOPE CONSTRAINTS|REGULATORY AWARENESS|OUTPUT FORMAT|system prompt)", re.IGNORECASE)),
    ("cross_org_reference", re.compile(r"\borganization[_ ]id\s*[:=]\s*[a-f0-9\-]{20,}\b", re.IGNORECASE)),
    ("raw_sql", re.compile(r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\s+\w", re.IGNORECASE)),
]

# Hallucination confidence threshold (0.0 = definitely hallucinating; higher is safer)
HALLUCINATION_FLAG_THRESHOLD: int = 2  # number of indicators before flagging


class OutputGuard:
    """
    Validates the LLM response before it is returned to the caller.
    Stores findings in ctx; may redact or block the response.
    """

    def check(self, ctx: GuardrailContext, raw_response: str) -> str:
        ctx.llm_response_raw = raw_response
        cleaned = raw_response

        # PII scan on output
        for field_name, pattern in _PII_PATTERNS.items():
            if pattern.search(raw_response):
                ctx.output_pii_detected = True
                ctx.output_pii_fields.append(field_name)
                cleaned = pattern.sub(f"[{field_name.upper()} REDACTED]", cleaned)

        if ctx.output_pii_detected:
            ctx.flag(layer="output", reason=f"PII detected in output: {ctx.output_pii_fields}")
            logger.warning(
                "output_pii_redacted",
                org_id=ctx.org_id,
                fields=ctx.output_pii_fields,
            )

        # Prohibited content check
        for label, pattern in _PROHIBITED_PATTERNS:
            if pattern.search(raw_response):
                ctx.content_filter_triggered = True
                ctx.content_filter_reason = label
                ctx.block(layer="output", reason=f"Prohibited content in output: {label}")
                logger.error(
                    "output_prohibited_content",
                    org_id=ctx.org_id,
                    label=label,
                )
                return "[Response blocked by content filter.]"

        # Hallucination signal scan
        flag_count = 0
        for label, pattern in _HALLUCINATION_INDICATORS:
            if pattern.search(raw_response):
                ctx.hallucination_flags.append(label)
                flag_count += 1

        ctx.hallucination_score = round(flag_count / len(_HALLUCINATION_INDICATORS), 2)

        if flag_count >= HALLUCINATION_FLAG_THRESHOLD:
            ctx.flag(
                layer="output",
                reason=f"Hallucination indicators detected: {ctx.hallucination_flags}",
            )
            logger.warning(
                "output_hallucination_flagged",
                org_id=ctx.org_id,
                flags=ctx.hallucination_flags,
                score=ctx.hallucination_score,
            )

        ctx.final_response = cleaned
        return cleaned
