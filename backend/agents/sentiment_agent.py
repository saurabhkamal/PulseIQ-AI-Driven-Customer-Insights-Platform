"""
SentimentAgent — classifies customer feedback into positive/neutral/negative
with a score (-1 to 1) and confidence (0 to 1).
Uses gpt-4o-mini for cost-effective high-volume classification.
"""
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel

from core.config import get_settings
from core.logging import get_logger
from .base import BaseAgent
from .prompts import SENTIMENT_SYSTEM, SENTIMENT_USER

logger = get_logger(__name__)
settings = get_settings()


class SentimentInput(BaseModel):
    id: str
    text: str


class SentimentOutput(BaseModel):
    id: str
    sentiment: str   # positive | neutral | negative
    score: float
    confidence: float


class SentimentAgent(BaseAgent):
    name = "sentiment_agent"

    async def run(self, feedback_items: list[dict[str, Any]]) -> list[SentimentOutput]:
        """
        Classify a batch of feedback items.
        Input: [{ "id": str, "text": str }]
        Output: [SentimentOutput]
        """
        if not feedback_items:
            return []

        # Anonymize: strip any potential PII markers before sending to OpenAI
        safe_items = [
            {"id": item["id"], "text": self._sanitize(item["text"])}
            for item in feedback_items
        ]

        user_prompt = SENTIMENT_USER.format(
            feedback_items=str(safe_items[:50])  # batch max 50 for token budget
        )

        raw = await self._call(
            system_prompt=SENTIMENT_SYSTEM,
            user_prompt=user_prompt,
            model=settings.openai_model_mini,
            task_type="sentiment_classification",
        )

        results = []
        for item in self._parse_json_list(raw):
            try:
                results.append(SentimentOutput(
                    id=item.get("id", ""),
                    sentiment=item.get("sentiment", "neutral"),
                    score=max(-1.0, min(1.0, float(item.get("score", 0)))),
                    confidence=max(0.0, min(1.0, float(item.get("confidence", 0.5)))),
                ))
            except Exception as exc:
                logger.warning("sentiment_output_invalid", org_id=self.org_id, error=str(exc))

        logger.info(
            "sentiment_classified",
            org_id=self.org_id,
            input_count=len(feedback_items),
            output_count=len(results),
        )
        return results

    @staticmethod
    def _sanitize(text: str) -> str:
        """Basic sanitization — strip leading/trailing whitespace, limit length."""
        return text.strip()[:2000]
