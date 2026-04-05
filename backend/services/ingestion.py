"""
Ingestion service — validates, normalises, and queues data for the ETL pipeline.
All ingestion returns 202 Accepted with a job_id.
AI enrichment is triggered asynchronously — never inside this request path.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import get_cache, TTL_PIPELINE
from core.logging import get_logger
from schemas.ingestion import (
    SalesIngestionRequest, ProductsIngestionRequest, CustomersIngestionRequest,
    EventsIngestionRequest, FeedbackIngestionRequest,
    IngestionResponse, IngestionError,
)

logger = get_logger(__name__)


class IngestionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.cache = get_cache()

    async def _create_job(self, org_id: str, data_type: str, record_count: int) -> str:
        job_id = str(uuid.uuid4())
        await self.cache.set(
            self.cache.pipeline_key(job_id),
            {
                "status": "queued",
                "org_id": org_id,
                "data_type": data_type,
                "record_count": record_count,
                "accepted": 0,
                "rejected": 0,
                "progress_pct": 0,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            },
            ttl=TTL_PIPELINE,
        )
        return job_id

    async def ingest_sales(self, org_id: str, req: SalesIngestionRequest) -> IngestionResponse:
        errors: list[IngestionError] = []
        valid = []
        for i, r in enumerate(req.records):
            if r.amount <= 0:
                errors.append(IngestionError(index=i, reason="amount must be positive"))
            else:
                valid.append(r)

        job_id = await self._create_job(org_id, "sales", len(req.records))
        logger.info("sales_ingestion_queued", job_id=job_id, org_id=org_id, count=len(valid))
        return IngestionResponse(job_id=job_id, accepted=len(valid), rejected=len(errors), errors=errors)

    async def ingest_products(self, org_id: str, req: ProductsIngestionRequest) -> IngestionResponse:
        job_id = await self._create_job(org_id, "products", len(req.records))
        logger.info("products_ingestion_queued", job_id=job_id, org_id=org_id, count=len(req.records))
        return IngestionResponse(job_id=job_id, accepted=len(req.records), rejected=0)

    async def ingest_customers(self, org_id: str, req: CustomersIngestionRequest) -> IngestionResponse:
        job_id = await self._create_job(org_id, "customers", len(req.records))
        logger.info("customers_ingestion_queued", job_id=job_id, org_id=org_id, count=len(req.records))
        return IngestionResponse(job_id=job_id, accepted=len(req.records), rejected=0)

    async def ingest_events(self, org_id: str, req: EventsIngestionRequest) -> IngestionResponse:
        job_id = await self._create_job(org_id, "events", len(req.records))
        logger.info("events_ingestion_queued", job_id=job_id, org_id=org_id, count=len(req.records))
        return IngestionResponse(job_id=job_id, accepted=len(req.records), rejected=0)

    async def ingest_feedback(self, org_id: str, req: FeedbackIngestionRequest) -> IngestionResponse:
        job_id = await self._create_job(org_id, "feedback", len(req.records))
        logger.info("feedback_ingestion_queued", job_id=job_id, org_id=org_id, count=len(req.records))
        return IngestionResponse(job_id=job_id, accepted=len(req.records), rejected=0)

    async def get_job_status(self, job_id: str) -> dict | None:
        return await self.cache.get(self.cache.pipeline_key(job_id))
