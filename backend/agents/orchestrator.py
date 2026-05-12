"""
Orchestrator — routes tasks to the appropriate agents and persists their outputs.
Triggered by: pipeline completion, scheduled jobs, or user-requested refresh.
Runs asynchronously — never called from a synchronous request handler.

Pipeline order:
  BehaviorAnalysisAgent → ChurnPredictionAgent → EngagementScoringAgent
  → JourneyAbandonmentAgent → TrendPredictionAgent → ProductAffinityAgent
  → CrossSellIntelligenceAgent → RecommendationAgent
  [ComplianceSignalAgent — weekly schedule only, controlled by run_compliance flag]
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from core.cache import get_cache, TTL_PIPELINE
from repositories.analytics import AnalyticsRepository
from repositories.sentiment import SentimentRepository
from repositories.trends import TrendRepository
from repositories.insights import InsightRepository
from repositories.base import BaseRepository
from models.trend import TrendPrediction
from models.insight import Insight
from models.compliance_signal import ComplianceSignal
from .behavior_agent import BehaviorAnalysisAgent
from .trend_agent import TrendPredictionAgent
from .recommendation_agent import RecommendationAgent
from .churn_agent import ChurnPredictionAgent
from .engagement_agent import EngagementScoringAgent
from .abandonment_agent import JourneyAbandonmentAgent
from .product_affinity_agent import ProductAffinityAgent
from .cross_sell_agent import CrossSellIntelligenceAgent
from .compliance_agent import ComplianceSignalAgent

logger = get_logger(__name__)


class Orchestrator:
    def __init__(self, session: AsyncSession, org_id: str, org_name: str) -> None:
        self.session = session
        self.org_id = org_id
        self.org_name = org_name
        self.cache = get_cache()

    async def run_full_analysis(
        self,
        job_id: str | None = None,
        run_compliance: bool = False,
    ) -> dict:
        """
        Full pipeline: behavior → churn → engagement → abandonment →
        trends → product_affinity → cross_sell → recommendations.
        ComplianceSignalAgent runs only when run_compliance=True (weekly schedule).
        """
        logger.info("orchestrator_started", org_id=self.org_id, job_id=job_id)
        await self._update_job(job_id, "processing", 0)

        now = datetime.now(timezone.utc)
        start = now - timedelta(days=30)
        analytics_repo = AnalyticsRepository(self.session)
        sentiment_repo = SentimentRepository(self.session)
        insight_repo = InsightRepository(self.session)
        insight_base = BaseRepository(Insight, self.session)
        trend_base = BaseRepository(TrendPrediction, self.session)

        try:
            # ── Step 1: Behavior Analysis ──────────────────────────────────
            funnel = await analytics_repo.get_funnel(self.org_id, start, now)
            top_products = await analytics_repo.get_top_products(self.org_id, start, now)
            cohort_data = await analytics_repo.get_cohort_data(self.org_id, start, now)

            behavior_agent = BehaviorAnalysisAgent(self.org_id)
            behavior_output = await behavior_agent.run(
                org_name=self.org_name,
                period=f"{start.date()} to {now.date()}",
                funnel_data=funnel,
                top_products=top_products,
                cohort_summary=cohort_data,
            )
            await self._update_job(job_id, "processing", 12)

            # ── Step 2: Churn Prediction ───────────────────────────────────
            sentiment_summary = await sentiment_repo.get_summary(self.org_id)
            churn_signals = await analytics_repo.get_churn_signals(self.org_id, start, now)
            sentiment_trend = await sentiment_repo.get_trend(self.org_id, start, now)

            churn_agent = ChurnPredictionAgent(self.org_id)
            churn_output = await churn_agent.run(
                org_name=self.org_name,
                period=f"{start.date()} to {now.date()}",
                cohort_activity={"cohorts": cohort_data},
                event_patterns=churn_signals,
                sentiment_trend=sentiment_trend,
            )
            await self._update_job(job_id, "processing", 24)

            # ── Step 3: Engagement Scoring ─────────────────────────────────
            engagement_signals = await analytics_repo.get_engagement_signals(self.org_id, start, now)

            engagement_agent = EngagementScoringAgent(self.org_id)
            engagement_output = await engagement_agent.run(
                org_name=self.org_name,
                period=f"{start.date()} to {now.date()}",
                event_frequency_by_segment=engagement_signals.get("by_segment", {}),
                channel_distribution=engagement_signals.get("channels", {}),
                product_depth_by_segment=engagement_signals.get("product_depth", {}),
            )
            await self._update_job(job_id, "processing", 36)

            # ── Step 4: Journey Abandonment ────────────────────────────────
            abandonment_agent = JourneyAbandonmentAgent(self.org_id)
            abandonment_output = await abandonment_agent.run(
                org_name=self.org_name,
                journey_type="kyc",
                funnel_steps=funnel,
                properties_summary={},
            )
            await self._update_job(job_id, "processing", 48)

            # ── Step 5: Trend Prediction ───────────────────────────────────
            trend_agent = TrendPredictionAgent(self.org_id)
            trend_outputs = await trend_agent.run(
                org_name=self.org_name,
                period=f"{start.date()} to {now.date()}",
                top_products=top_products,
                category_data=[],
                event_patterns=churn_signals,
                max_trends=5,
            )
            for t in trend_outputs:
                await trend_base.create(TrendPrediction(
                    organization_id=self.org_id,
                    title=t.title,
                    description=t.description,
                    category=t.category,
                    confidence=t.confidence,
                    signal_strength=t.signal_strength,
                    supporting_data={},
                    model_used="gpt-4o",
                    horizon_days=t.horizon_days,
                    generated_at=now,
                ))
            await self._update_job(job_id, "processing", 60)

            # ── Step 6: Product Affinity ───────────────────────────────────
            affinity_agent = ProductAffinityAgent(self.org_id)
            affinity_output = await affinity_agent.run(
                org_name=self.org_name,
                products_catalog=top_products,
                customer_segments=[behavior_output.segments] if hasattr(behavior_output, "segments") else [],
                event_patterns=churn_signals,
                top_products=top_products,
            )
            await self._update_job(job_id, "processing", 72)

            # ── Step 7: Cross-Sell Intelligence ───────────────────────────
            engagement_scores_dict = {
                "overall": engagement_output.overall_engagement_score,
                "by_segment": [s.model_dump() for s in engagement_output.segment_scores],
            }
            cross_sell_agent = CrossSellIntelligenceAgent(self.org_id)
            cross_sell_output = await cross_sell_agent.run(
                org_name=self.org_name,
                product_holdings={},
                transaction_patterns=churn_signals,
                engagement_scores=engagement_scores_dict,
                available_products=top_products,
            )
            await self._update_job(job_id, "processing", 84)

            # ── Step 8: Recommendations (final synthesis) ──────────────────
            rec_agent = RecommendationAgent(self.org_id)
            rec_outputs = await rec_agent.run(
                org_name=self.org_name,
                behavior_summary=behavior_output.summary,
                trends=[t.model_dump() for t in trend_outputs],
                positive_pct=sentiment_summary.get("positive_pct", 0),
                neutral_pct=sentiment_summary.get("neutral_pct", 0),
                negative_pct=sentiment_summary.get("negative_pct", 0),
            )
            for r in rec_outputs:
                await insight_base.create(Insight(
                    organization_id=self.org_id,
                    type=r.type,
                    priority=r.priority,
                    title=r.title,
                    description=r.description,
                    supporting_data=r.supporting_data,
                    source_agent="recommendation_agent",
                    model_used="gpt-4o",
                    generated_at=now,
                ))

            # Persist churn insight
            await insight_base.create(Insight(
                organization_id=self.org_id,
                type="churn_prevention",
                priority="high" if churn_output.estimated_at_risk_pct > 0.15 else "medium",
                title=f"Churn Risk: {churn_output.high_risk_segment_description[:80]}",
                description="; ".join(churn_output.recommended_retention_actions),
                supporting_data={"signals": churn_output.top_churn_signals, "confidence": churn_output.confidence},
                source_agent="churn_prediction_agent",
                model_used="gpt-4o",
                generated_at=now,
            ))

            # Persist cross-sell insights
            for opp in cross_sell_output.opportunities[:3]:
                await insight_base.create(Insight(
                    organization_id=self.org_id,
                    type="cross_sell",
                    priority=opp.priority,
                    title=f"Cross-sell: {opp.source_product} → {opp.target_product}",
                    description=opp.recommended_message_angle,
                    supporting_data={"propensity": opp.propensity_score, "segment": opp.segment},
                    source_agent="cross_sell_intelligence_agent",
                    model_used="gpt-4o",
                    generated_at=now,
                ))

            await self._invalidate_caches()
            await self._update_job(job_id, "processing", 96)

            # ── Step 9: Compliance (weekly schedule only) ──────────────────
            compliance_persisted = 0
            if run_compliance:
                compliance_persisted = await self._run_compliance(
                    sentiment_summary=sentiment_summary,
                    sentiment_trend=sentiment_trend,
                    now=now,
                )

            await self._update_job(job_id, "completed", 100)
            logger.info(
                "orchestrator_completed",
                org_id=self.org_id,
                job_id=job_id,
                trends=len(trend_outputs),
                insights=len(rec_outputs),
                compliance_signals=compliance_persisted,
            )
            return {
                "status": "completed",
                "trends": len(trend_outputs),
                "insights": len(rec_outputs) + 1 + len(cross_sell_output.opportunities[:3]),
                "compliance_signals": compliance_persisted,
            }

        except Exception as exc:
            logger.error("orchestrator_failed", org_id=self.org_id, job_id=job_id, error=str(exc))
            await self._update_job(job_id, "failed", 0)
            raise

    async def _run_compliance(
        self,
        sentiment_summary: dict,
        sentiment_trend: dict,
        now: datetime,
    ) -> int:
        compliance_agent = ComplianceSignalAgent(self.org_id)
        result = await compliance_agent.run(
            org_name=self.org_name,
            sentiment_summary=sentiment_summary,
            complaint_volume_trend=sentiment_trend,
            kyc_failure_rate=0.0,
            vulnerable_event_signals={},
        )
        if result.severity != "none":
            signal = ComplianceSignal(
                organization_id=self.org_id,
                signal_type=result.signal_type,
                severity=result.severity,
                description=result.description,
                affected_population_estimate=result.affected_population_estimate,
                recommended_review_action=result.recommended_review_action,
                regulatory_reference=result.regulatory_reference,
                supporting_data={},
                model_used="gpt-4o",
                generated_at=now,
            )
            self.session.add(signal)
            await self.session.commit()
            return 1
        return 0

    async def _invalidate_caches(self) -> None:
        await self.cache.delete(self.cache.insight_key(self.org_id, "all"))

    async def _update_job(self, job_id: str | None, status: str, progress: int) -> None:
        if not job_id:
            return
        key = self.cache.pipeline_key(job_id)
        current = await self.cache.get(key) or {}
        current.update({"status": status, "progress_pct": progress})
        if status == "completed":
            current["completed_at"] = datetime.now(timezone.utc).isoformat()
        await self.cache.set(key, current, ttl=TTL_PIPELINE)
