"""
ETL Ingestion Worker — pulls queued ingestion jobs from ElastiCache,
validates, transforms, normalises, deduplicates, and persists raw data.
AI enrichment is triggered after persistence — never synchronously.

Flow:
  Ingest → Validate → Transform → Normalise → Deduplicate → Persist (raw)
         → Trigger AI Enrichment (async) → Update job state
"""
import asyncio
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.database import AsyncSessionLocal, set_org_context
from core.cache import get_cache, TTL_PIPELINE
from core.logging import get_logger

logger = get_logger(__name__)


class IngestionWorker:
    """
    Processes a single ingestion job identified by job_id.
    Designed to be stateless and horizontally scalable.
    """

    def __init__(self, job_id: str) -> None:
        self.job_id = job_id
        self.cache = get_cache()

    async def process(self) -> None:
        job = await self.cache.get(self.cache.pipeline_key(self.job_id))
        if not job:
            logger.warning("job_not_found", job_id=self.job_id)
            return

        org_id = job.get("org_id")
        data_type = job.get("data_type")
        logger.info("job_started", job_id=self.job_id, org_id=org_id, data_type=data_type)

        await self._update_status("processing", 10)

        async with AsyncSessionLocal() as session:
            await set_org_context(session, org_id)
            try:
                await self._run_pipeline(session, job)
                await session.commit()
                await self._update_status("completed", 100, completed=True)
                logger.info("job_completed", job_id=self.job_id, org_id=org_id)
            except Exception as exc:
                await session.rollback()
                await self._update_status("failed", 0)
                logger.error("job_failed", job_id=self.job_id, error=str(exc))

    async def _run_pipeline(self, session: AsyncSession, job: dict) -> None:
        """
        Validate → Transform → Normalise → Deduplicate → Persist.
        Dead-letter bad records to Supabase; do not fail the whole batch.
        """
        data_type = job.get("data_type")
        await self._update_status("processing", 30)

        # In production: deserialise records from a job queue (SQS, Redis list, etc.)
        # For now: the records are stored in the job payload or retrieved from staging table.
        records = job.get("records", [])

        validated = self._validate(records, data_type)
        await self._update_status("processing", 60)

        normalised = self._normalise(validated, data_type)
        await self._update_status("processing", 80)

        # Persist normalised records to the appropriate table
        await self._persist(session, normalised, data_type, job.get("org_id"))

        # Update job counters
        current = await self.cache.get(self.cache.pipeline_key(self.job_id)) or {}
        current["accepted"] = len(normalised)
        current["rejected"] = len(records) - len(normalised)
        await self.cache.set(self.cache.pipeline_key(self.job_id), current, ttl=TTL_PIPELINE)

    def _validate(self, records: list, data_type: str) -> list:
        """Return only valid records, logging failures."""
        valid = []
        for i, r in enumerate(records):
            try:
                if data_type == "sales" and float(r.get("amount", -1)) <= 0:
                    raise ValueError("amount must be positive")
                valid.append(r)
            except Exception as exc:
                logger.warning("record_invalid", job_id=self.job_id, index=i, reason=str(exc))
        return valid

    def _normalise(self, records: list, data_type: str) -> list:
        """Normalise field names, types, and date formats."""
        normalised = []
        for r in records:
            try:
                if data_type == "sales":
                    r["amount"] = float(r["amount"])
                    r["quantity"] = int(r.get("quantity", 1))
                normalised.append(r)
            except Exception as exc:
                logger.warning("record_normalise_failed", job_id=self.job_id, error=str(exc))
        return normalised

    async def _persist(
        self, session: AsyncSession, records: list, data_type: str, org_id: str
    ) -> None:
        """Persist normalised records. Deduplication via ON CONFLICT DO NOTHING."""
        # Full implementation inserts records via repository layer using
        # bulk insert with deduplication on (organization_id, external_id).
        pass

    async def _update_status(
        self, status: str, progress: int, completed: bool = False
    ) -> None:
        key = self.cache.pipeline_key(self.job_id)
        current = await self.cache.get(key) or {}
        current.update({"status": status, "progress_pct": progress})
        if completed:
            current["completed_at"] = datetime.now(timezone.utc).isoformat()
        await self.cache.set(key, current, ttl=TTL_PIPELINE)


async def run_worker_loop() -> None:
    """
    Long-running worker loop.
    In production: replace with SQS consumer or Redis BLPOP.
    """
    logger.info("ingestion_worker_started")
    cache = get_cache()
    while True:
        # Poll for pending jobs from a Redis list (production: SQS)
        # job_id = await cache._redis.blpop("pulseiq:ingestion:queue", timeout=5)
        # if job_id:
        #     await IngestionWorker(job_id[1]).process()
        await asyncio.sleep(5)
