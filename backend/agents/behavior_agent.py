"""
BehaviorAnalysisAgent — summarizes consumer funnel, cohort, and event data
into actionable insights.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import BEHAVIOR_SYSTEM, BEHAVIOR_USER

logger = get_logger(__name__)


class BehaviorAnalysisOutput(BaseModel):
    summary: str
    key_findings: list[str]
    bottleneck_stage: str | None
    recommendations: list[str]


class BehaviorAnalysisAgent(BaseAgent):
    name = "behavior_analysis_agent"

    async def run(
        self,
        org_name: str,
        period: str,
        funnel_data: list[dict[str, Any]],
        top_products: list[dict[str, Any]],
        cohort_summary: list[dict[str, Any]],
    ) -> BehaviorAnalysisOutput:
        user_prompt = BEHAVIOR_USER.format(
            org_name=org_name,
            period=period,
            funnel_data=str(funnel_data),
            top_products=str(top_products[:10]),
            cohort_summary=str(cohort_summary[:5]),
        )

        raw = await self._call(
            system_prompt=BEHAVIOR_SYSTEM,
            user_prompt=user_prompt,
            task_type="behavior_analysis",
        )

        parsed = self._parse_json(raw, fallback={})
        try:
            return BehaviorAnalysisOutput(
                summary=parsed.get("summary", ""),
                key_findings=parsed.get("key_findings", []),
                bottleneck_stage=parsed.get("bottleneck_stage"),
                recommendations=parsed.get("recommendations", []),
            )
        except Exception as exc:
            logger.error("behavior_output_invalid", org_id=self.org_id, error=str(exc))
            return BehaviorAnalysisOutput(
                summary="Analysis unavailable.",
                key_findings=[],
                bottleneck_stage=None,
                recommendations=[],
            )
