"""
Layer 2 — Input Guard
Detects and redacts PII, identifies prompt injection patterns,
and classifies the intent of the user's question.
"""
import re

from core.logging import get_logger
from .context import GuardrailContext

logger = get_logger(__name__)

# Regex patterns for common UK PII types
_PII_PATTERNS: dict[str, re.Pattern] = {
    "email": re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b"),
    "uk_phone": re.compile(r"\b(?:07\d{9}|\+447\d{9}|0\d{10})\b"),
    "uk_sort_code": re.compile(r"\b\d{2}[-\s]?\d{2}[-\s]?\d{2}\b"),
    "uk_account_number": re.compile(r"\b\d{8}\b"),
    "national_insurance": re.compile(r"\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b", re.IGNORECASE),
    "postcode": re.compile(r"\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b", re.IGNORECASE),
    "date_of_birth": re.compile(r"\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b"),
}

# Prompt injection indicators
_INJECTION_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("ignore_instructions", re.compile(r"\bignore\s+(all\s+)?(previous|prior|above)\s+instructions?\b", re.IGNORECASE)),
    ("system_override", re.compile(r"\b(system\s+prompt|you\s+are\s+now|act\s+as|pretend\s+you|roleplay\s+as)\b", re.IGNORECASE)),
    ("jailbreak_prefix", re.compile(r"\b(DAN|jailbreak|bypass\s+safety|no\s+restrictions?)\b", re.IGNORECASE)),
    ("prompt_exfil", re.compile(r"\b(repeat\s+your\s+(instructions?|prompt)|what\s+are\s+your\s+instructions?)\b", re.IGNORECASE)),
]

# Simple intent taxonomy for the audit log
_INTENT_KEYWORDS: dict[str, list[str]] = {
    "churn_analysis": ["churn", "attrition", "at risk", "leaving", "cancellation"],
    "funnel_analysis": ["funnel", "drop-off", "abandonment", "conversion", "kyc"],
    "trend_analysis": ["trend", "forecast", "predict", "upcoming", "growth"],
    "sentiment_analysis": ["sentiment", "satisfaction", "nps", "feedback", "complaint"],
    "product_analysis": ["product", "cross-sell", "upsell", "feature", "adoption"],
    "engagement_analysis": ["engagement", "active", "dau", "mau", "retention"],
    "general_analytics": ["why", "how", "what", "show", "compare", "explain"],
}


def _redact(text: str, pattern: re.Pattern, placeholder: str) -> str:
    return pattern.sub(f"[{placeholder}]", text)


class InputGuard:
    """
    Sanitizes user input: redacts PII, detects injection attacks,
    and classifies the question intent for routing and auditing.
    """

    def check(self, ctx: GuardrailContext) -> GuardrailContext:
        text = ctx.user_input
        redacted = text

        # PII detection and redaction
        for field_name, pattern in _PII_PATTERNS.items():
            if pattern.search(text):
                ctx.pii_detected = True
                ctx.pii_redacted_fields.append(field_name)
                redacted = _redact(redacted, pattern, field_name.upper())

        ctx.sanitized_input = redacted

        if ctx.pii_detected:
            logger.info(
                "input_pii_redacted",
                org_id=ctx.org_id,
                fields=ctx.pii_redacted_fields,
            )

        # Prompt injection detection
        for label, pattern in _INJECTION_PATTERNS:
            if pattern.search(text):
                ctx.prompt_injection_detected = True
                ctx.injection_pattern_matched = label
                ctx.block(layer="input", reason=f"Prompt injection detected: {label}")
                logger.warning(
                    "input_injection_detected",
                    org_id=ctx.org_id,
                    pattern=label,
                )
                return ctx

        # Intent classification (best-effort, used for audit only)
        lowered = text.lower()
        for intent, keywords in _INTENT_KEYWORDS.items():
            if any(kw in lowered for kw in keywords):
                ctx.input_classification = intent
                break
        else:
            ctx.input_classification = "unknown"

        return ctx
