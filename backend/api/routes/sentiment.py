from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AnyUser
from services.sentiment import SentimentService
from schemas.sentiment import SentimentResponse, SentimentSummary

router = APIRouter(prefix="/sentiment", tags=["sentiment"])


@router.get("", response_model=SentimentResponse)
async def get_sentiment(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    sentiment: str | None = Query(default=None),
    product_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> SentimentResponse:
    return await SentimentService(db).get_results(
        current_user.org_id,
        sentiment=sentiment,
        product_id=product_id,
        page=page,
        page_size=limit,
    )


@router.get("/summary", response_model=SentimentSummary)
async def get_sentiment_summary(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SentimentSummary:
    return await SentimentService(db).get_summary(current_user.org_id)
