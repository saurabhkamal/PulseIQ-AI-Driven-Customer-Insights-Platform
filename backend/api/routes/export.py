import csv
import io
import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from core.exceptions import ForbiddenError, NotFoundError
from schemas.export import ExportRequest, ExportResponse
from models.event import ConsumerEvent
from models.feedback import Feedback
from models.sentiment import SentimentResult
from models.insight import Insight
from models.trend import TrendPrediction

router = APIRouter(prefix="/export", tags=["export"])

_EXPORT_ROLES = ("admin", "analyst", "marketer")


async def _fetch_data(db: AsyncSession, req: ExportRequest, org_id: str) -> list[dict]:
    if req.type == "behavior":
        result = await db.execute(
            select(ConsumerEvent).where(
                ConsumerEvent.organization_id == org_id,
                ConsumerEvent.occurred_at >= req.start_date,
                ConsumerEvent.occurred_at <= req.end_date,
            ).order_by(ConsumerEvent.occurred_at.desc()).limit(5000)
        )
        rows = result.scalars().all()
        return [
            {"event_type": r.event_type, "customer_id": r.customer_id,
             "occurred_at": str(r.occurred_at), "properties": json.dumps(r.properties)}
            for r in rows
        ]

    elif req.type == "sentiment":
        result = await db.execute(
            select(Feedback, SentimentResult)
            .join(SentimentResult, SentimentResult.feedback_id == Feedback.id, isouter=True)
            .where(
                Feedback.organization_id == org_id,
                Feedback.submitted_at >= req.start_date,
                Feedback.submitted_at <= req.end_date,
            ).order_by(Feedback.submitted_at.desc()).limit(5000)
        )
        rows = result.all()
        return [
            {"feedback_id": f.id, "text": f.text, "rating": f.rating,
             "source": f.source, "submitted_at": str(f.submitted_at),
             "sentiment": s.sentiment if s else None,
             "score": float(s.score) if s else None,
             "confidence": float(s.confidence) if s else None}
            for f, s in rows
        ]

    elif req.type == "trends":
        result = await db.execute(
            select(TrendPrediction).where(
                TrendPrediction.organization_id == org_id,
                TrendPrediction.generated_at >= req.start_date,
                TrendPrediction.generated_at <= req.end_date,
            ).order_by(TrendPrediction.confidence.desc()).limit(500)
        )
        rows = result.scalars().all()
        return [
            {"title": r.title, "category": r.category, "confidence": float(r.confidence),
             "signal_strength": r.signal_strength, "horizon_days": r.horizon_days,
             "generated_at": str(r.generated_at)}
            for r in rows
        ]

    elif req.type == "recommendations":
        result = await db.execute(
            select(Insight).where(
                Insight.organization_id == org_id,
                Insight.generated_at >= req.start_date,
                Insight.generated_at <= req.end_date,
            ).order_by(Insight.generated_at.desc()).limit(500)
        )
        rows = result.scalars().all()
        return [
            {"title": r.title, "type": r.type, "priority": r.priority,
             "description": r.description, "source_agent": r.source_agent,
             "generated_at": str(r.generated_at)}
            for r in rows
        ]

    return []


@router.post("/report", response_model=ExportResponse, status_code=202)
async def create_export(
    body: ExportRequest,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ExportResponse:
    if current_user.role not in _EXPORT_ROLES:
        raise ForbiddenError("Export requires Analyst, Marketer, or Admin role")
    export_id = str(uuid.uuid4())
    return ExportResponse(export_id=export_id, status="ready", download_url=f"/api/v1/export/{export_id}/download")


@router.get("/{export_id}/download")
async def download_export(
    export_id: str,
    type: str,
    format: str,
    start_date: str,
    end_date: str,
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> StreamingResponse:
    if current_user.role not in _EXPORT_ROLES:
        raise ForbiddenError("Export requires Analyst, Marketer, or Admin role")

    from datetime import datetime
    try:
        req = ExportRequest(
            type=type,  # type: ignore[arg-type]
            format=format,  # type: ignore[arg-type]
            start_date=datetime.fromisoformat(start_date),
            end_date=datetime.fromisoformat(end_date),
        )
    except Exception:
        raise ForbiddenError("Invalid export parameters")

    data = await _fetch_data(db, req, current_user.org_id)
    filename = f"pulseiq_{type}_{export_id[:8]}"

    if format == "json":
        content = json.dumps(data, indent=2, default=str)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
        )

    # Default: CSV
    if not data:
        csv_content = "no data available for selected range"
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
        )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
    )


@router.get("/{export_id}", response_model=ExportResponse)
async def get_export(
    export_id: str,
    current_user: AnyUser,
) -> ExportResponse:
    return ExportResponse(export_id=export_id, status="ready", download_url=f"/api/v1/export/{export_id}/download")
