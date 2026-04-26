"""
RecommendationAgent — synthesizes behavior analysis, trend predictions,
and sentiment overview into prioritized marketing and sales recommendations.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import RECOMMENDATION_SYSTEM, RECOMMENDATION_USER

logger = get_logger(__name__)


class RecommendationOutput(BaseModel):
    type: str           # marketing | sales | product | retention
    priority: str       # high | medium | low
    title: str
    description: str
    supporting_data: dict[str, Any]


class RecommendationAgent(BaseAgent):
    name = "recommendation_agent"

    async def run(
        self,
        org_name: str,
        behavior_summary: str,
        trends: list[dict[str, Any]],
        positive_pct: float,
        neutral_pct: float,
        negative_pct: float,
        max_recommendations: int = 10,
    ) -> list[RecommendationOutput]:
        user_prompt = RECOMMENDATION_USER.format(
            org_name=org_name,
            behavior_summary=behavior_summary,
            trends=str(trends[:5]),
            positive_pct=round(positive_pct, 1),
            neutral_pct=round(neutral_pct, 1),
            negative_pct=round(negative_pct, 1),
            max_recommendations=max_recommendations,
        )

        raw = await self._call(
            system_prompt=RECOMMENDATION_SYSTEM,
            user_prompt=user_prompt,
            task_type="recommendation_generation",
        )

        results: list[RecommendationOutput] = []
        for item in self._parse_json_list(raw):
            try:
                results.append(RecommendationOutput(
                    type=item.get("type", "marketing"),
                    priority=item.get("priority", "medium"),
                    title=item.get("title", ""),
                    description=item.get("description", ""),
                    supporting_data=item.get("supporting_data", {}),
                ))
            except Exception as exc:
                logger.warning("recommendation_output_invalid", org_id=self.org_id, error=str(exc))

        logger.info("recommendations_generated", org_id=self.org_id, count=len(results))
        return results
