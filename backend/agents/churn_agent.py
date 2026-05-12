"""
ChurnPredictionAgent — identifies at-risk customer/user segments using behavioural signals.
Signals: reduced login frequency, payment failures, dormant accounts, negative sentiment trends.
Outputs a churn risk profile persisted as a 'churn_prevention' insight.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import CHURN_SYSTEM, CHURN_USER

logger = get_logger(__name__)


class ChurnPredictionOutput(BaseModel):
    high_risk_segment_description: str
    estimated_at_risk_pct: float
    top_churn_signals: list[str]
    recommended_retention_actions: list[str]
    confidence: float


class ChurnPredictionAgent(BaseAgent):
    name = "churn_prediction_agent"

    async def run(
        self,
        org_name: str,
        period: str,
        cohort_activity: dict[str, Any],
        event_patterns: dict[str, Any],
        sentiment_trend: dict[str, Any],
    ) -> ChurnPredictionOutput:
        user_prompt = CHURN_USER.format(
            org_name=org_name,
            period=period,
            cohort_activity=str(cohort_activity),
            event_patterns=str(event_patterns),
            sentiment_trend=str(sentiment_trend),
        )

        raw = await self._call(
            system_prompt=CHURN_SYSTEM,
            user_prompt=user_prompt,
            task_type="churn_prediction",
        )

        parsed = self._parse_json(raw, fallback={})
        try:
            output = ChurnPredictionOutput(
                high_risk_segment_description=parsed.get("high_risk_segment_description", "Unknown"),
                estimated_at_risk_pct=float(parsed.get("estimated_at_risk_pct", 0.0)),
                top_churn_signals=parsed.get("top_churn_signals", []),
                recommended_retention_actions=parsed.get("recommended_retention_actions", []),
                confidence=min(max(float(parsed.get("confidence", 0.5)), 0.0), 1.0),
            )
        except Exception as exc:
            logger.warning("churn_output_invalid", org_id=self.org_id, error=str(exc))
            output = ChurnPredictionOutput(
                high_risk_segment_description="Analysis unavailable",
                estimated_at_risk_pct=0.0,
                top_churn_signals=[],
                recommended_retention_actions=[],
                confidence=0.0,
            )

        logger.info("churn_prediction_completed", org_id=self.org_id, at_risk_pct=output.estimated_at_risk_pct)
        return output
