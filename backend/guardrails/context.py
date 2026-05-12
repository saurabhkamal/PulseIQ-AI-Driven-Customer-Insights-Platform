"""
GuardrailContext — mutable audit envelope passed through all 6 guardrail layers.
Each layer writes its findings into this object; the monitor layer persists it.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class GuardrailContext:
    # Identity
    org_id: str
    user_id: str
    session_id: str | None = None
    feature: str = "analyst"
    user_role: str = "viewer"

    # Input
    user_input: str = ""
    sanitized_input: str | None = None

    # Layer 1 — Input guard
    pii_detected: bool = False
    pii_redacted_fields: list[str] = field(default_factory=list)
    prompt_injection_detected: bool = False
    injection_pattern_matched: str | None = None
    input_classification: str | None = None  # "analytics_query" | "pii_request" | "jailbreak" | ...

    # Layer 2 — Policy guard
    policy_violations: list[str] = field(default_factory=list)
    policy_action: str | None = None  # "allow" | "block" | "warn"

    # Layer 3 — Instruction
    system_prompt_version: str | None = None
    system_prompt_hash: str | None = None

    # Layer 4 — Execution
    tools_allowed: list[str] = field(default_factory=list)
    tools_called: list[str] = field(default_factory=list)
    tools_blocked: list[str] = field(default_factory=list)
    tool_call_count: int = 0
    tool_call_details: dict[str, Any] = field(default_factory=dict)

    # LLM call metadata
    model_used: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    latency_ms: int | None = None
    llm_response_raw: str | None = None

    # Layer 5 — Output guard
    output_pii_detected: bool = False
    output_pii_fields: list[str] = field(default_factory=list)
    hallucination_flags: list[str] = field(default_factory=list)
    hallucination_score: float | None = None
    content_filter_triggered: bool = False
    content_filter_reason: str | None = None
    final_response: str | None = None

    # Overall outcome
    guardrail_layer_triggered: str | None = None  # which layer blocked/flagged
    overall_status: str = "completed"  # "completed" | "blocked" | "failed" | "flagged"
    error_message: str | None = None

    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def block(self, layer: str, reason: str) -> None:
        """Mark this request as blocked by a specific layer."""
        self.guardrail_layer_triggered = layer
        self.overall_status = "blocked"
        self.error_message = reason

    def flag(self, layer: str, reason: str) -> None:
        """Mark as completed but flagged for review."""
        if self.overall_status == "completed":
            self.guardrail_layer_triggered = layer
            self.overall_status = "flagged"
            self.error_message = reason

    @property
    def is_blocked(self) -> bool:
        return self.overall_status == "blocked"
