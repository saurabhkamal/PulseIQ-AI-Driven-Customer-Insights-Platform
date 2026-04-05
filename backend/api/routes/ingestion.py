from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import NotFoundError
from api.dependencies import AnyUser
from services.ingestion import IngestionService
from schemas.ingestion import (
    SalesIngestionRequest, ProductsIngestionRequest, CustomersIngestionRequest,
    EventsIngestionRequest, FeedbackIngestionRequest,
    IngestionResponse, UploadResponse, JobStatusResponse,
)

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


@router.post("/sales", response_model=IngestionResponse, status_code=202)
async def ingest_sales(
    body: SalesIngestionRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IngestionResponse:
    return await IngestionService(db).ingest_sales(current_user.org_id, body)


@router.post("/products", response_model=IngestionResponse, status_code=202)
async def ingest_products(
    body: ProductsIngestionRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IngestionResponse:
    return await IngestionService(db).ingest_products(current_user.org_id, body)


@router.post("/customers", response_model=IngestionResponse, status_code=202)
async def ingest_customers(
    body: CustomersIngestionRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IngestionResponse:
    return await IngestionService(db).ingest_customers(current_user.org_id, body)


@router.post("/events", response_model=IngestionResponse, status_code=202)
async def ingest_events(
    body: EventsIngestionRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IngestionResponse:
    return await IngestionService(db).ingest_events(current_user.org_id, body)


@router.post("/feedback", response_model=IngestionResponse, status_code=202)
async def ingest_feedback(
    body: FeedbackIngestionRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IngestionResponse:
    return await IngestionService(db).ingest_feedback(current_user.org_id, body)


@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_csv(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    type: str = Form(...),
) -> UploadResponse:
    import uuid
    content = await file.read()
    row_count = max(0, content.count(b"\n") - 1)
    job_id = str(uuid.uuid4())
    return UploadResponse(
        job_id=job_id,
        status="queued",
        filename=file.filename or "upload.csv",
        row_count=row_count,
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobStatusResponse:
    state = await IngestionService(db).get_job_status(job_id)
    if not state:
        raise NotFoundError(f"Job {job_id} not found")
    return JobStatusResponse(
        job_id=job_id,
        status=state.get("status", "queued"),
        progress_pct=state.get("progress_pct", 0),
        accepted=state.get("accepted", 0),
        rejected=state.get("rejected", 0),
        completed_at=state.get("completed_at"),
    )
