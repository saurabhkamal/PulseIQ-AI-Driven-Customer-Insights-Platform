from datetime import datetime
from typing import Literal

from pydantic import BaseModel

SentimentLabel = Literal["positive", "neutral", "negative"]


class SentimentSummary(BaseModel):
    positive_pct: float
    neutral_pct: float
    negative_pct: float
    average_score: float
    total: int


class SentimentResultResponse(BaseModel):
    id: str
    feedback_id: str
    sentiment: SentimentLabel
    score: float
    confidence: float
    product_id: str | None
    product_name: str | None
    analyzed_at: datetime

    model_config = {"from_attributes": True}


class SentimentResponse(BaseModel):
    summary: SentimentSummary
    data: list[SentimentResultResponse]
    total: int
    page: int
    limit: int
