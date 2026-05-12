from datetime import datetime
from typing import Literal

from pydantic import BaseModel

SentimentLabel = Literal["positive", "neutral", "negative"]


class SentimentSummary(BaseModel):
    positive: int
    neutral: int
    negative: int
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
    analyzed_at: datetime
    product_name: str | None = None

    model_config = {"from_attributes": True}


class SentimentResponse(BaseModel):
    summary: SentimentSummary
    data: list[SentimentResultResponse]
    total: int
    page: int
    limit: int


class SentimentWeek(BaseModel):
    week: str
    positive: int
    neutral: int
    negative: int
    total: int


class SentimentBySource(BaseModel):
    source: str
    positive: int
    neutral: int
    negative: int
    total: int


class SentimentByProduct(BaseModel):
    product: str
    positive: int
    neutral: int
    negative: int
    total: int


class SentimentChartsData(BaseModel):
    weekly_trend: list[SentimentWeek]
    by_source: list[SentimentBySource]
    by_product: list[SentimentByProduct]
