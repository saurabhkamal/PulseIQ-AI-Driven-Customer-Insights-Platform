from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class SaleRecord(BaseModel):
    external_id: str
    product_id: str | None = None
    customer_id: str | None = None
    amount: float = Field(gt=0)
    currency: str = "USD"
    quantity: int = Field(default=1, gt=0)
    transaction_at: datetime
    metadata: dict[str, Any] = {}


class ProductRecord(BaseModel):
    external_id: str
    name: str
    category: str | None = None
    price: float | None = None
    currency: str = "USD"
    attributes: dict[str, Any] = {}


class CustomerRecord(BaseModel):
    external_id: str
    email_hash: str | None = None
    segment: str | None = None
    region: str | None = None
    attributes: dict[str, Any] = {}


class EventRecord(BaseModel):
    external_id: str | None = None
    customer_id: str | None = None
    event_type: Literal["view", "click", "add_to_cart", "remove_from_cart", "purchase", "review", "search", "other"]
    product_id: str | None = None
    occurred_at: datetime
    properties: dict[str, Any] = {}


class FeedbackRecord(BaseModel):
    external_id: str | None = None
    customer_id: str | None = None
    product_id: str | None = None
    text: str = Field(min_length=1, max_length=10000)
    rating: int | None = Field(default=None, ge=1, le=5)
    source: Literal["website", "email", "survey", "app", "other"] = "website"
    submitted_at: datetime | None = None


class SalesIngestionRequest(BaseModel):
    records: list[SaleRecord] = Field(max_length=5000)


class ProductsIngestionRequest(BaseModel):
    records: list[ProductRecord] = Field(max_length=5000)


class CustomersIngestionRequest(BaseModel):
    records: list[CustomerRecord] = Field(max_length=5000)


class EventsIngestionRequest(BaseModel):
    records: list[EventRecord] = Field(max_length=10000)


class FeedbackIngestionRequest(BaseModel):
    records: list[FeedbackRecord] = Field(max_length=5000)


class IngestionError(BaseModel):
    index: int
    reason: str


class IngestionResponse(BaseModel):
    job_id: str
    accepted: int
    rejected: int
    errors: list[IngestionError] = []


class UploadResponse(BaseModel):
    job_id: str
    status: str
    filename: str
    row_count: int


class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress_pct: int = 0
    accepted: int = 0
    rejected: int = 0
    completed_at: datetime | None = None
