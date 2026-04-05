from datetime import datetime
from typing import Any

from pydantic import BaseModel


class FunnelStage(BaseModel):
    stage: str
    count: int
    drop_off_pct: float


class BehaviorResponse(BaseModel):
    period: dict[str, str]
    funnel: list[FunnelStage]
    cohorts: list[dict[str, Any]]
    top_products: list[dict[str, Any]]
    heatmap_url: str | None = None


class TrendItem(BaseModel):
    id: str
    title: str
    description: str
    confidence: float
    category: str | None
    signal_strength: str
    predicted_at: datetime

    model_config = {"from_attributes": True}


class TrendsResponse(BaseModel):
    generated_at: datetime
    trends: list[TrendItem]


class CohortResponse(BaseModel):
    cohort_by: str
    metric: str
    data: list[dict[str, Any]]


class KpiMetric(BaseModel):
    id: str
    label: str
    value: float
    formatted_value: str
    trend: str
    trend_value: str
