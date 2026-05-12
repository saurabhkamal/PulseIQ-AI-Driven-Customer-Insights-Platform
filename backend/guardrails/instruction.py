"""
Layer 3 — Instruction Guard
Manages scoped, versioned system prompts for the analyst.
Prevents system prompt leakage and ensures the LLM is always
operating under the correct organizational and role constraints.
"""
import hashlib

from core.logging import get_logger
from .context import GuardrailContext

logger = get_logger(__name__)

# Current system prompt version — bump this string on every prompt change
SYSTEM_PROMPT_VERSION = "analyst-v1.0"

# The analyst system prompt.  Role and org_id are injected at runtime.
# This template is the single source of truth — never inline this elsewhere.
_ANALYST_SYSTEM_TEMPLATE = """\
You are an AI analyst for {org_name}, a UK financial services organization using PulseIQ.
Your role is {user_role}. You answer questions about customer behaviour, product performance,
retention, churn, KYC journeys, and regulatory signals based on data from the PulseIQ platform.

SCOPE CONSTRAINTS:
- Only answer questions about data that belongs to organization {org_id}.
- You MUST use the provided tools to fetch data before answering. Never fabricate numbers.
- Do not reveal customer PII, raw personal data, or information about other organizations.
- Do not discuss competitor pricing, insider information, or unreleased product details.
- Do not speculate beyond what the data supports; explicitly state confidence level.
- If you cannot answer from available data, say so clearly.

REGULATORY AWARENESS:
- Be aware of UK FCA Consumer Duty, TCF, PSD2, and Open Banking context when relevant.
- Flag potential compliance signals if data suggests vulnerable customer patterns.
- Always qualify trend statements with appropriate uncertainty.

OUTPUT FORMAT:
- Lead with the direct answer to the user's question.
- Follow with supporting evidence (data points, percentages, comparisons).
- End with a concise recommendation if one is warranted.
- Keep responses factual, concise, and professional.
"""


class InstructionGuard:
    """
    Returns the scoped system prompt for the analyst session.
    Logs the prompt version and hash so any drift is detectable in audit logs.
    """

    def get_system_prompt(
        self,
        ctx: GuardrailContext,
        org_name: str,
    ) -> str:
        prompt = _ANALYST_SYSTEM_TEMPLATE.format(
            org_name=org_name,
            org_id=ctx.org_id,
            user_role=ctx.user_role,
        )
        ctx.system_prompt_version = SYSTEM_PROMPT_VERSION
        ctx.system_prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:16]

        logger.debug(
            "instruction_prompt_applied",
            org_id=ctx.org_id,
            version=SYSTEM_PROMPT_VERSION,
            hash=ctx.system_prompt_hash,
        )
        return prompt
