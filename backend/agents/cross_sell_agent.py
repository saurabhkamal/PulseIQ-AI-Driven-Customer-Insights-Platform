"""
CrossSellIntelligenceAgent — identifies cross-sell opportunities across customer segments.
Retail banking: current account holders → loans, ISAs, credit cards, mortgages.
Fintech: free-tier users showing premium-tier behavioural signals.
Produces propensity scores and CRM targeting criteria.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import CROSS_SELL_SYSTEM, CROSS_SELL_USER

logger = get_logger(__name__)


class CrossSellOpportunity(BaseModel):
    source_product: str
    target_product: str
    segment: str
    propensity_score: float
    estimated_eligible_customers: int
    recommended_message_angle: str
    targeting_criteria: str
    priority: str  # high | medium | low


class CrossSellOutput(BaseModel):
    opportunities: list[CrossSellOpportunity]


class CrossSellIntelligenceAgent(BaseAgent):
    name = "cross_sell_intelligence_agent"

    async def run(
        self,
        org_name: str,
        product_holdings: dict[str, Any],
        transaction_patterns: dict[str, Any],
        engagement_scores: dict[str, Any],
        available_products: list[dict[str, Any]],
        max_opportunities: int = 10,
    ) -> CrossSellOutput:
        user_prompt = CROSS_SELL_USER.format(
            org_name=org_name,
            product_holdings=str(product_holdings),
            transaction_patterns=str(transaction_patterns),
            engagement_scores=str(engagement_scores),
            available_products=str(available_products[:20]),
            max_opportunities=max_opportunities,
        )

        raw = await self._call(
            system_prompt=CROSS_SELL_SYSTEM,
            user_prompt=user_prompt,
            task_type="cross_sell_intelligence",
        )

        parsed = self._parse_json(raw, fallback=[])
        items = parsed if isinstance(parsed, list) else []
        opportunities: list[CrossSellOpportunity] = []
        for item in items:
            try:
                opportunities.append(CrossSellOpportunity(
                    source_product=item.get("source_product", ""),
                    target_product=item.get("target_product", ""),
                    segment=item.get("segment", ""),
                    propensity_score=min(max(float(item.get("propensity_score", 0.0)), 0.0), 1.0),
                    estimated_eligible_customers=int(item.get("estimated_eligible_customers", 0)),
                    recommended_message_angle=item.get("recommended_message_angle", ""),
                    targeting_criteria=item.get("targeting_criteria", ""),
                    priority=item.get("priority", "medium"),
                ))
            except Exception as exc:
                logger.warning("cross_sell_item_invalid", org_id=self.org_id, error=str(exc))

        output = CrossSellOutput(opportunities=opportunities)
        logger.info("cross_sell_completed", org_id=self.org_id, opportunities=len(opportunities))
        return output
