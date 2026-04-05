"""
TrendPredictionAgent — analyzes sales and behavioral signals to forecast
emerging product and market trends.
"""
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import TREND_SYSTEM, TREND_USER

logger = get_logger(__name__)


class TrendOutput(BaseModel):
    title: str
    description: str
    category: str | None
    confidence: float
    signal_strength: str    # high | medium | low
    horizon_days: int


class TrendPredictionAgent(BaseAgent):
    name = "trend_prediction_agent"

    async def run(
        self,
        org_name: str,
        period: str,
        top_products: list[dict[str, Any]],
        category_data: list[dict[str, Any]],
        event_patterns: dict[str, Any],
        max_trends: int = 5,
    ) -> list[TrendOutput]:
        user_prompt = TREND_USER.format(
            org_name=org_name,
            period=period,
            top_products=str(top_products[:10]),
            category_data=str(category_data[:10]),
            event_patterns=str(event_patterns),
            max_trends=max_trends,
        )

        raw = await self._call(
            system_prompt=TREND_SYSTEM,
            user_prompt=user_prompt,
            task_type="trend_prediction",
        )

        parsed = self._parse_json(raw, fallback=[])
        results: list[TrendOutput] = []
        for item in parsed if isinstance(parsed, list) else []:
            try:
                results.append(TrendOutput(
                    title=item.get("title", ""),
                    description=item.get("description", ""),
                    category=item.get("category"),
                    confidence=max(0.0, min(1.0, float(item.get("confidence", 0.5)))),
                    signal_strength=item.get("signal_strength", "medium"),
                    horizon_days=int(item.get("horizon_days", 30)),
                ))
            except Exception as exc:
                logger.warning("trend_output_item_invalid", org_id=self.org_id, error=str(exc))

        logger.info("trends_generated", org_id=self.org_id, count=len(results))
        return results
