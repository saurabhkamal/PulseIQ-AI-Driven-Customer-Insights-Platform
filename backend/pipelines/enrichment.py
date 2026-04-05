"""
AI Enrichment Pipeline — triggered after raw data is persisted.
Runs sentiment analysis on new feedback and schedules orchestrator for
behavior analysis + trend prediction + recommendations.
Never called synchronously from the ingestion request path.
"""
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from core.database import AsyncSessionLocal, set_org_context
from core.cache import get_cache
from core.logging import get_logger
from agents.sentiment_agent import SentimentAgent
from agents.orchestrator import Orchestrator

logger = get_logger(__name__)


async def enrich_feedback(org_id: str, feedback_items: list[dict]) -> None:
    """
    Run sentiment analysis on newly ingested feedback.
    Persists results to sentiment_results table.
    """
    if not feedback_items:
        return

    logger.info("enrichment_feedback_started", org_id=org_id, count=len(feedback_items))
    agent = SentimentAgent(org_id)

    # Process in batches of 50
    batch_size = 50
    results = []
    for i in range(0, len(feedback_items), batch_size):
        batch = feedback_items[i: i + batch_size]
        batch_results = await agent.run(batch)
        results.extend(batch_results)

    # Persist to sentiment_results — implemented in pipeline worker
    logger.info("enrichment_feedback_completed", org_id=org_id, results=len(results))
    return results


async def schedule_full_analysis(org_id: str, org_name: str, job_id: str) -> None:
    """
    Kick off the full orchestrator pipeline in a background task.
    Called after ingestion completes — never during the ingestion request.
    """
    logger.info("full_analysis_scheduled", org_id=org_id, job_id=job_id)
    async with AsyncSessionLocal() as session:
        await set_org_context(session, org_id)
        orchestrator = Orchestrator(session, org_id, org_name)
        await orchestrator.run_full_analysis(job_id=job_id)
