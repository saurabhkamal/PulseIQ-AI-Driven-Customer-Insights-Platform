"""
Layer 4 — Execution Guard
Enforces the tool allowlist per user role, ensures every tool call
is scoped to the correct org_id, and caps the number of tool calls
per request to prevent runaway agent loops.
"""
from typing import Any, Callable

from core.logging import get_logger
from .context import GuardrailContext

logger = get_logger(__name__)

MAX_TOOL_CALLS: int = 10

# Tools each role is permitted to call in the analyst
_ROLE_TOOL_ALLOWLIST: dict[str, frozenset[str]] = {
    "admin": frozenset({
        "get_kpi_metrics", "get_funnel_data", "get_cohort_data",
        "get_top_products", "get_sentiment_summary", "get_insights",
        "get_trends", "search_insights", "get_churn_signals",
        "get_engagement_scores", "get_compliance_signals",
    }),
    "analyst": frozenset({
        "get_kpi_metrics", "get_funnel_data", "get_cohort_data",
        "get_top_products", "get_sentiment_summary", "get_insights",
        "get_trends", "search_insights", "get_churn_signals",
        "get_engagement_scores",
    }),
    "marketer": frozenset({
        "get_kpi_metrics", "get_insights", "get_sentiment_summary",
    }),
    "viewer": frozenset(),
}


class ExecutionGuard:
    """
    Wraps each tool call from the LangGraph agent.
    Checks the allowlist, injects org_id scoping, records outcomes.
    """

    def __init__(self, ctx: GuardrailContext) -> None:
        self._ctx = ctx
        self._allowed: frozenset[str] = _ROLE_TOOL_ALLOWLIST.get(ctx.user_role, frozenset())
        ctx.tools_allowed = sorted(self._allowed)

    async def call_tool(
        self,
        tool_name: str,
        tool_fn: Callable,
        kwargs: dict[str, Any],
    ) -> Any:
        ctx = self._ctx

        if ctx.tool_call_count >= MAX_TOOL_CALLS:
            ctx.tools_blocked.append(f"{tool_name}:max_calls_exceeded")
            ctx.flag(layer="execution", reason="Max tool call limit reached.")
            logger.warning(
                "execution_max_calls_exceeded",
                org_id=ctx.org_id,
                tool=tool_name,
                count=ctx.tool_call_count,
            )
            raise RuntimeError("Maximum tool call limit exceeded for this request.")

        if tool_name not in self._allowed:
            ctx.tools_blocked.append(f"{tool_name}:not_in_allowlist")
            logger.warning(
                "execution_tool_blocked",
                org_id=ctx.org_id,
                tool=tool_name,
                role=ctx.user_role,
            )
            raise PermissionError(f"Tool '{tool_name}' is not permitted for role '{ctx.user_role}'.")

        # Enforce org_id scoping on every tool call
        kwargs["org_id"] = ctx.org_id

        ctx.tool_call_count += 1
        ctx.tools_called.append(tool_name)
        ctx.tool_call_details[f"{tool_name}#{ctx.tool_call_count}"] = {
            "kwargs_keys": list(kwargs.keys()),
        }

        logger.info(
            "execution_tool_called",
            org_id=ctx.org_id,
            tool=tool_name,
            call_number=ctx.tool_call_count,
        )

        result = await tool_fn(**kwargs)
        return result
