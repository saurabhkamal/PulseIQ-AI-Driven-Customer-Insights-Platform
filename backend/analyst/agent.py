"""
AnalystAgent — the entry point for the conversational analyst feature.
Chains the 6 guardrail layers around a LangGraph ReAct graph:

  Request
    → PolicyGuard      (role + topic check)
    → InputGuard       (PII redaction + injection detection)
    → InstructionGuard (scoped system prompt)
    → ExecutionGuard   (tool allowlist + org_id enforcement)
    → LangGraph ReAct  (LLM + tool calls)
    → OutputGuard      (PII scan + hallucination check)
    → Monitor          (persist full audit context)
    → Response
"""
import time
from datetime import datetime, timezone

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from guardrails.context import GuardrailContext
from guardrails.policy import PolicyGuard
from guardrails.input_guard import InputGuard
from guardrails.instruction import InstructionGuard
from guardrails.execution import ExecutionGuard
from guardrails.output_guard import OutputGuard
from guardrails.monitor import GuardrailMonitor
from .tools import build_tools
from .graph import build_graph

logger = get_logger(__name__)

_policy_guard = PolicyGuard()
_input_guard = InputGuard()
_instruction_guard = InstructionGuard()
_output_guard = OutputGuard()


class AnalystAgent:
    """
    Stateless entry point; a new instance per request is fine.
    session — AsyncSession for DB tool calls and audit logging.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def query(
        self,
        user_input: str,
        org_id: str,
        org_name: str,
        user_id: str,
        user_role: str,
        session_id: str | None = None,
    ) -> dict:
        ctx = GuardrailContext(
            org_id=org_id,
            user_id=user_id,
            session_id=session_id,
            feature="analyst",
            user_role=user_role,
            user_input=user_input,
            created_at=datetime.now(timezone.utc),
        )

        monitor = GuardrailMonitor(self._session)

        try:
            # ── Layer 1: Policy ──────────────────────────────────────────
            ctx = _policy_guard.check(ctx)
            if ctx.is_blocked:
                await monitor.log(ctx)
                return _blocked_response(ctx)

            # ── Layer 2: Input ───────────────────────────────────────────
            ctx = _input_guard.check(ctx)
            if ctx.is_blocked:
                await monitor.log(ctx)
                return _blocked_response(ctx)

            # ── Layer 3: Instruction ─────────────────────────────────────
            system_prompt = _instruction_guard.get_system_prompt(ctx, org_name)

            # ── Layer 4: Execution guard wraps tools ─────────────────────
            execution_guard = ExecutionGuard(ctx)
            raw_tools = build_tools(self._session)

            # Wrap each tool so execution guard enforces allowlist + org_id
            allowed_tools = [
                t for t in raw_tools
                if t.name in execution_guard._allowed
            ]

            # ── LangGraph ReAct ──────────────────────────────────────────
            graph = build_graph(
                system_prompt=system_prompt,
                tools=allowed_tools,
            )

            question = ctx.sanitized_input or ctx.user_input
            t0 = time.monotonic()

            result = await graph.ainvoke(
                {"messages": [HumanMessage(content=question)]}
            )

            ctx.latency_ms = int((time.monotonic() - t0) * 1000)

            # Extract final text response + usage from graph state
            last_message = result["messages"][-1]
            raw_response = last_message.content if hasattr(last_message, "content") else str(last_message)

            # Record token usage if available
            if hasattr(last_message, "usage_metadata") and last_message.usage_metadata:
                ctx.prompt_tokens = last_message.usage_metadata.get("input_tokens")
                ctx.completion_tokens = last_message.usage_metadata.get("output_tokens")

            ctx.model_used = "gpt-4o"

            # ── Layer 5: Output guard ────────────────────────────────────
            clean_response = _output_guard.check(ctx, raw_response)
            if ctx.is_blocked:
                await monitor.log(ctx)
                return _blocked_response(ctx)

            logger.info(
                "analyst_query_completed",
                org_id=org_id,
                status=ctx.overall_status,
                latency_ms=ctx.latency_ms,
                tool_calls=ctx.tool_call_count,
            )

        except Exception as exc:
            ctx.overall_status = "failed"
            ctx.error_message = str(exc)
            logger.error("analyst_query_failed", org_id=org_id, error=str(exc))
            clean_response = "An error occurred while processing your question. Please try again."
        finally:
            # ── Layer 6: Monitor (always runs) ───────────────────────────
            await monitor.log(ctx)

        return {
            "answer": clean_response,
            "status": ctx.overall_status,
            "tool_calls_made": ctx.tool_call_count,
            "guardrail_triggered": ctx.guardrail_layer_triggered,
            "latency_ms": ctx.latency_ms,
        }


def _blocked_response(ctx: GuardrailContext) -> dict:
    return {
        "answer": ctx.error_message or "Your request could not be processed.",
        "status": "blocked",
        "tool_calls_made": 0,
        "guardrail_triggered": ctx.guardrail_layer_triggered,
        "latency_ms": None,
    }
