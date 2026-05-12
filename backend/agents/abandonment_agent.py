"""
JourneyAbandonmentAgent — identifies micro-friction points in UK financial onboarding journeys.
Covers: KYC funnels, account opening, loan applications, subscription activation.
Outputs abandonment analysis persisted as a 'conversion_optimization' insight.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import ABANDONMENT_SYSTEM, ABANDONMENT_USER

logger = get_logger(__name__)


class AbandonmentOutput(BaseModel):
    critical_drop_off_stage: str
    drop_off_rate_at_stage: float
    likely_friction_causes: list[str]
    suggested_fixes: list[str]
    estimated_recovery_uplift_pct: float


class JourneyAbandonmentAgent(BaseAgent):
    name = "journey_abandonment_agent"

    async def run(
        self,
        org_name: str,
        journey_type: str,
        funnel_steps: list[dict[str, Any]],
        properties_summary: dict[str, Any],
    ) -> AbandonmentOutput:
        user_prompt = ABANDONMENT_USER.format(
            org_name=org_name,
            journey_type=journey_type,
            funnel_steps=str(funnel_steps),
            properties_summary=str(properties_summary),
        )

        raw = await self._call(
            system_prompt=ABANDONMENT_SYSTEM,
            user_prompt=user_prompt,
            task_type="journey_abandonment_analysis",
        )

        parsed = self._parse_json(raw, fallback={})
        try:
            output = AbandonmentOutput(
                critical_drop_off_stage=parsed.get("critical_drop_off_stage", "unknown"),
                drop_off_rate_at_stage=float(parsed.get("drop_off_rate_at_stage", 0.0)),
                likely_friction_causes=parsed.get("likely_friction_causes", []),
                suggested_fixes=parsed.get("suggested_fixes", []),
                estimated_recovery_uplift_pct=float(parsed.get("estimated_recovery_uplift_pct", 0.0)),
            )
        except Exception as exc:
            logger.warning("abandonment_output_invalid", org_id=self.org_id, error=str(exc))
            output = AbandonmentOutput(
                critical_drop_off_stage="unknown",
                drop_off_rate_at_stage=0.0,
                likely_friction_causes=[],
                suggested_fixes=[],
                estimated_recovery_uplift_pct=0.0,
            )

        logger.info(
            "abandonment_analysis_completed",
            org_id=self.org_id,
            journey_type=journey_type,
            drop_off_stage=output.critical_drop_off_stage,
        )
        return output
