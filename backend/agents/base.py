"""
Base class for all PulseIQ AI agents.
Agents never access the DB directly — all data goes through the tool layer.
"""
import json
from abc import ABC, abstractmethod
from typing import Any

from core.logging import get_logger
from core.openai_client import chat_completion
from core.config import get_settings

logger = get_logger(__name__)
settings = get_settings()


class BaseAgent(ABC):
    name: str = "base"

    def __init__(self, org_id: str) -> None:
        self.org_id = org_id

    async def _call(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        task_type: str | None = None,
    ) -> str:
        return await chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=model or settings.openai_model_default,
            response_format={"type": "json_object"},
            temperature=0.1,
            org_id=self.org_id,
            task_type=task_type or self.name,
        )

    def _parse_json(self, raw: str, fallback: Any) -> Any:
        """Parse JSON with explicit fallback on failure — never trust raw model output."""
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(
                "agent_json_parse_failed",
                agent=self.name,
                org_id=self.org_id,
                error=str(exc),
                raw=raw[:200],
            )
            return fallback

    @abstractmethod
    async def run(self, **kwargs: Any) -> Any:
        """Execute the agent's core task. All args passed as keyword arguments."""
