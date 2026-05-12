from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Dashboard summary sub-schemas
# ---------------------------------------------------------------------------

class RevenueDayPoint(BaseModel):
    date: str
    revenue: float


class TopProductItem(BaseModel):
    id: str
    name: str
    revenue: float
    units: int


class ComplianceAlertSummary(BaseModel):
    high_unreviewed: int
    medium_unreviewed: int
    low_unreviewed: int
    total_unreviewed: int


class ChurnRiskSummary(BaseModel):
    high: int
    medium: int
    low: int
    total: int


class PipelineStatusData(BaseModel):
    last_run_at: str | None
    insights_total: int
    sentiment_total: int
    trends_total: int
    status: str  # "healthy" | "warning" | "idle"


class FunnelStageItem(BaseModel):
    stage: str
    count: int
    drop_off_pct: float


class FunnelHealthData(BaseModel):
    conversion_rate: float
    stages: list[FunnelStageItem]
    total_top: int


class NetSentimentWeek(BaseModel):
    week: str
    score: float


class NetSentimentData(BaseModel):
    score: float
    positive_pct: float
    negative_pct: float
    weekly: list[NetSentimentWeek]


class NewVsReturningData(BaseModel):
    new_customers: int
    returning_customers: int
    total: int
    new_pct: float
    returning_pct: float


class DashboardSummaryResponse(BaseModel):
    revenue_trend: list[RevenueDayPoint]
    top_products: list[TopProductItem]
    compliance_alerts: ComplianceAlertSummary
    churn_risk: ChurnRiskSummary
    pipeline_status: PipelineStatusData
    funnel_health: FunnelHealthData
    net_sentiment: NetSentimentData
    new_vs_returning: NewVsReturningData


# ---------------------------------------------------------------------------
# Dashboard CRUD schemas
# ---------------------------------------------------------------------------

class DashboardCreate(BaseModel):
    name: str
    description: str | None = None
    layout: dict[str, Any] = {}
    widgets: list[dict[str, Any]] = []


class DashboardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    layout: dict[str, Any] | None = None
    widgets: list[dict[str, Any]] | None = None


class DashboardResponse(BaseModel):
    id: str
    organization_id: str
    created_by: str | None
    name: str
    description: str | None
    layout: dict[str, Any]
    widgets: list[dict[str, Any]]
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
