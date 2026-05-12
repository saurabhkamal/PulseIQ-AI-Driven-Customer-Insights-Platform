"""
Layer 1 — Policy Guard
Enforces role-based allowlists, feature-level blocklists, and org-level policies
before any input processing or LLM call takes place.
"""
from core.logging import get_logger
from .context import GuardrailContext

logger = get_logger(__name__)

# Roles permitted to use the conversational analyst
ANALYST_ALLOWED_ROLES: frozenset[str] = frozenset({"admin", "analyst"})

# Topics the analyst must never engage with regardless of input phrasing
BLOCKED_TOPICS: list[str] = [
    "competitor pricing",
    "insider information",
    "personal customer data export",
    "raw PII",
    "system prompt",
    "ignore previous",
    "bypass",
    "jailbreak",
]

# Maximum input length to prevent prompt stuffing
MAX_INPUT_CHARS: int = 2000


class PolicyGuard:
    """
    Checks org-level and role-level access policies.
    Runs first — before any tokenization or model call.
    """

    def check(self, ctx: GuardrailContext) -> GuardrailContext:
        # Role enforcement
        if ctx.user_role not in ANALYST_ALLOWED_ROLES:
            ctx.block(
                layer="policy",
                reason=f"Role '{ctx.user_role}' is not permitted to use the analyst feature.",
            )
            logger.warning(
                "policy_role_blocked",
                org_id=ctx.org_id,
                user_id=ctx.user_id,
                role=ctx.user_role,
            )
            return ctx

        # Input length cap
        if len(ctx.user_input) > MAX_INPUT_CHARS:
            ctx.block(
                layer="policy",
                reason=f"Input exceeds maximum allowed length of {MAX_INPUT_CHARS} characters.",
            )
            logger.warning("policy_input_too_long", org_id=ctx.org_id, length=len(ctx.user_input))
            return ctx

        # Blocked topic scan (case-insensitive keyword match)
        lowered = ctx.user_input.lower()
        for topic in BLOCKED_TOPICS:
            if topic in lowered:
                ctx.policy_violations.append(f"blocked_topic:{topic}")

        if ctx.policy_violations:
            ctx.policy_action = "block"
            ctx.block(
                layer="policy",
                reason=f"Input contains blocked topic(s): {ctx.policy_violations}",
            )
            logger.warning(
                "policy_topic_blocked",
                org_id=ctx.org_id,
                violations=ctx.policy_violations,
            )
        else:
            ctx.policy_action = "allow"

        return ctx
