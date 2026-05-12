"""
ProductAffinityAgent — identifies Next Best Product/Action (NBPA) for customer segments.
Retail banking: current account → loan, ISA, credit card, mortgage.
Fintech: free tier → premium tier, feature unlock.
Outputs product affinity scores persisted as 'product_acquisition' or 'feature_adoption' insights.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import PRODUCT_AFFINITY_SYSTEM, PRODUCT_AFFINITY_USER

logger = get_logger(__name__)


class ProductAffinityRecommendation(BaseModel):
    product: str
    segment: str
    affinity_score: float
    rationale: str
    targeting_criteria: str


class ProductAffinityOutput(BaseModel):
    recommendations: list[ProductAffinityRecommendation]
    priority_segment: str
    expected_conversion_range: str


class ProductAffinityAgent(BaseAgent):
    name = "product_affinity_agent"

    async def run(
        self,
        org_name: str,
        products_catalog: list[dict[str, Any]],
        customer_segments: list[dict[str, Any]],
        event_patterns: dict[str, Any],
        top_products: list[dict[str, Any]],
    ) -> ProductAffinityOutput:
        user_prompt = PRODUCT_AFFINITY_USER.format(
            org_name=org_name,
            products_catalog=str(products_catalog[:20]),
            customer_segments=str(customer_segments[:10]),
            event_patterns=str(event_patterns),
            top_products=str(top_products[:10]),
        )

        raw = await self._call(
            system_prompt=PRODUCT_AFFINITY_SYSTEM,
            user_prompt=user_prompt,
            task_type="product_affinity_scoring",
        )

        parsed = self._parse_json(raw, fallback={})
        recs: list[ProductAffinityRecommendation] = []
        for item in parsed.get("recommendations", []):
            try:
                recs.append(ProductAffinityRecommendation(
                    product=item.get("product", ""),
                    segment=item.get("segment", ""),
                    affinity_score=min(max(float(item.get("affinity_score", 0.0)), 0.0), 1.0),
                    rationale=item.get("rationale", ""),
                    targeting_criteria=item.get("targeting_criteria", ""),
                ))
            except Exception as exc:
                logger.warning("product_affinity_item_invalid", org_id=self.org_id, error=str(exc))

        output = ProductAffinityOutput(
            recommendations=recs,
            priority_segment=parsed.get("priority_segment", ""),
            expected_conversion_range=parsed.get("expected_conversion_range", ""),
        )
        logger.info("product_affinity_completed", org_id=self.org_id, opportunities=len(recs))
        return output
