"""
EngagementScoringAgent — computes a composite engagement score (0–100) per customer segment.
Banking: digital vs. branch channel migration, self-service adoption, product breadth.
Fintech: DAU/MAU depth, feature adoption, notification engagement.
Persists as 'retention' insights.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import ENGAGEMENT_SYSTEM, ENGAGEMENT_USER

logger = get_logger(__name__)


class SegmentScore(BaseModel):
    segment: str
    score: float
    trend: str   # improving | stable | declining
    key_driver: str


class EngagementScoringOutput(BaseModel):
    overall_engagement_score: float
    segment_scores: list[SegmentScore]
    highest_engaged_segment: str
    lowest_engaged_segment: str
    engagement_growth_actions: list[str]


class EngagementScoringAgent(BaseAgent):
    name = "engagement_scoring_agent"

    async def run(
        self,
        org_name: str,
        period: str,
        event_frequency_by_segment: dict[str, Any],
        channel_distribution: dict[str, Any],
        product_depth_by_segment: dict[str, Any],
    ) -> EngagementScoringOutput:
        user_prompt = ENGAGEMENT_USER.format(
            org_name=org_name,
            period=period,
            event_frequency_by_segment=str(event_frequency_by_segment),
            channel_distribution=str(channel_distribution),
            product_depth_by_segment=str(product_depth_by_segment),
        )

        raw = await self._call(
            system_prompt=ENGAGEMENT_SYSTEM,
            user_prompt=user_prompt,
            task_type="engagement_scoring",
        )

        parsed = self._parse_json(raw, fallback={})
        segment_scores: list[SegmentScore] = []
        for item in parsed.get("segment_scores", []):
            try:
                segment_scores.append(SegmentScore(
                    segment=item.get("segment", ""),
                    score=min(max(float(item.get("score", 0.0)), 0.0), 100.0),
                    trend=item.get("trend", "stable"),
                    key_driver=item.get("key_driver", ""),
                ))
            except Exception as exc:
                logger.warning("engagement_segment_invalid", org_id=self.org_id, error=str(exc))

        try:
            output = EngagementScoringOutput(
                overall_engagement_score=min(max(float(parsed.get("overall_engagement_score", 0.0)), 0.0), 100.0),
                segment_scores=segment_scores,
                highest_engaged_segment=parsed.get("highest_engaged_segment", ""),
                lowest_engaged_segment=parsed.get("lowest_engaged_segment", ""),
                engagement_growth_actions=parsed.get("engagement_growth_actions", []),
            )
        except Exception as exc:
            logger.warning("engagement_output_invalid", org_id=self.org_id, error=str(exc))
            output = EngagementScoringOutput(
                overall_engagement_score=0.0,
                segment_scores=[],
                highest_engaged_segment="",
                lowest_engaged_segment="",
                engagement_growth_actions=[],
            )

        logger.info(
            "engagement_scoring_completed",
            org_id=self.org_id,
            overall_score=output.overall_engagement_score,
        )
        return output
