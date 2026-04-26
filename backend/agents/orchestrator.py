"""
Orchestrator — routes tasks to the appropriate agents and persists their outputs.
Triggered by: pipeline completion, scheduled jobs, or user-requested refresh.
Runs asynchronously — never called from a synchronous request handler.
"""
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from core.cache import get_cache, TTL_PIPELINE
from repositories.analytics import AnalyticsRepository
from repositories.sentiment import SentimentRepository
from repositories.trends import TrendRepository
from repositories.insights import InsightRepository
from models.trend import TrendPrediction
from models.insight import Insight
from models.sentiment import SentimentResult
from .behavior_agent import BehaviorAnalysisAgent
from .trend_agent import TrendPredictionAgent
from .recommendation_agent import RecommendationAgent
from .sentiment_agent import SentimentAgent

logger = get_logger(__name__)


class Orchestrator:
    def __init__(self, session: AsyncSession, org_id: str, org_name: str) -> None:
        self.session = session
        self.org_id = org_id
        self.org_name = org_name
        self.cache = get_cache()

    async def run_full_analysis(self, job_id: str | None = None) -> dict:
        """
        Full pipeline: behavior → trends → recommendations.
        Persists all outputs to Supabase and invalidates relevant caches.
        """
        logger.info("orchestrator_started", org_id=self.org_id, job_id=job_id)
        await self._update_job(job_id, "processing", 0)

        from datetime import timedelta
        from repositories.base import BaseRepository

        try:
            now = datetime.now(timezone.utc)
            start = now - timedelta(days=30)

            # ── Step 0: Sentiment Analysis ─────────────────────────────
            sentiment_repo = SentimentRepository(self.session)
            unanalyzed = await sentiment_repo.get_unanalyzed_feedback(self.org_id, limit=100)
            sentiment_count = 0
            if unanalyzed:
                sentiment_agent = SentimentAgent(self.org_id)
                for i in range(0, len(unanalyzed), 50):
                    batch = unanalyzed[i: i + 50]
                    results = await sentiment_agent.run(batch)
                    for r in results:
                        await BaseRepository(SentimentResult, self.session).create(
                            SentimentResult(
                                organization_id=self.org_id,
                                feedback_id=r.id,
                                sentiment=r.sentiment,
                                score=r.score,
                                confidence=r.confidence,
                                model_used="gpt-4o-mini",
                                analyzed_at=now,
                            )
                        )
                    sentiment_count += len(results)
            await self._update_job(job_id, "processing", 20)
            logger.info("sentiment_step_done", org_id=self.org_id, classified=sentiment_count)

            # ── Step 1: Behavior Analysis ──────────────────────────────
            analytics_repo = AnalyticsRepository(self.session)
            funnel = await analytics_repo.get_funnel(self.org_id, start, now)
            top_products = await analytics_repo.get_top_products(self.org_id, start, now)

            behavior_agent = BehaviorAnalysisAgent(self.org_id)
            behavior_output = await behavior_agent.run(
                org_name=self.org_name,
                period=f"{start.date()} to {now.date()}",
                funnel_data=funnel,
                top_products=top_products,
                cohort_summary=[],
            )
            await self._update_job(job_id, "processing", 50)

            # ── Step 2: Trend Prediction ────────────────────────────────
            trend_agent = TrendPredictionAgent(self.org_id)
            trend_outputs = await trend_agent.run(
                org_name=self.org_name,
                period=f"{start.date()} to {now.date()}",
                top_products=top_products,
                category_data=[],
                event_patterns={},
                max_trends=5,
            )

            for t in trend_outputs:
                await BaseRepository(TrendPrediction, self.session).create(
                    TrendPrediction(
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
                    )
                )
            await self._update_job(job_id, "processing", 75)

            # ── Step 3: Recommendations ────────────────────────────────
            sentiment_summary = await sentiment_repo.get_summary(self.org_id)

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
                await BaseRepository(Insight, self.session).create(
                    Insight(
                        organization_id=self.org_id,
                        type=r.type,
                        priority=r.priority,
                        title=r.title,
                        description=r.description,
                        supporting_data=r.supporting_data,
                        source_agent="recommendation_agent",
                        model_used="gpt-4o",
                        generated_at=now,
                    )
                )

            # Invalidate insight + sentiment caches
            await self.cache.delete(self.cache.insight_key(self.org_id, "all"))

            await self._update_job(job_id, "completed", 100)
            logger.info("orchestrator_completed", org_id=self.org_id, job_id=job_id)
            return {
                "status": "completed",
                "sentiment_classified": sentiment_count,
                "trends": len(trend_outputs),
                "insights": len(rec_outputs),
            }

        except Exception as exc:
            logger.error("orchestrator_failed", org_id=self.org_id, job_id=job_id, error=str(exc))
            await self._update_job(job_id, "failed", 0)
            raise

    async def _update_job(self, job_id: str | None, status: str, progress: int) -> None:
        if not job_id:
            return
        key = self.cache.pipeline_key(job_id)
        current = await self.cache.get(key) or {}
        current.update({"status": status, "progress_pct": progress})
        if status == "completed":
            current["completed_at"] = datetime.now(timezone.utc).isoformat()
        await self.cache.set(key, current, ttl=TTL_PIPELINE)
