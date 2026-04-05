import math

from sqlalchemy.ext.asyncio import AsyncSession

from core.cache import get_cache, TTL_INSIGHT
from core.exceptions import NotFoundError
from core.logging import get_logger
from repositories.insights import InsightRepository
from schemas.insights import InsightResponse
from schemas.common import PaginatedResponse, PaginationMeta, JobResponse

logger = get_logger(__name__)


class InsightsService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = InsightRepository(session)
        self.cache = get_cache()

    async def list_insights(
        self,
        org_id: str,
        insight_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[InsightResponse]:
        cache_key = self.cache.insight_key(org_id, insight_type or "all")
        cached = await self.cache.get(cache_key)
        if cached and page == 1:
            data = [InsightResponse(**i) for i in cached["data"]]
            meta = cached["meta"]
            return PaginatedResponse(data=data, meta=PaginationMeta(**meta))

        offset = (page - 1) * page_size
        rows, total = await self.repo.get_by_org(
            org_id, insight_type=insight_type, offset=offset, limit=page_size
        )
        result = PaginatedResponse(
            data=[InsightResponse.model_validate(r) for r in rows],
            meta=PaginationMeta(
                page=page, page_size=page_size, total=total,
                total_pages=math.ceil(total / page_size),
            ),
        )

        if page == 1:
            await self.cache.set(
                cache_key,
                {"data": [i.model_dump(mode="json") for i in result.data], "meta": result.meta.model_dump()},
                ttl=TTL_INSIGHT,
            )
        return result

    async def trigger_refresh(self, org_id: str) -> JobResponse:
        """Queue a background insight generation job via the orchestrator."""
        import uuid
        job_id = str(uuid.uuid4())
        cache = get_cache()
        await cache.set(
            cache.pipeline_key(job_id),
            {"status": "queued", "org_id": org_id, "type": "insights_refresh"},
            ttl=3600,
        )
        logger.info("insights_refresh_queued", job_id=job_id, org_id=org_id)
        # The orchestrator worker picks this up asynchronously
        return JobResponse(job_id=job_id, status="queued")
