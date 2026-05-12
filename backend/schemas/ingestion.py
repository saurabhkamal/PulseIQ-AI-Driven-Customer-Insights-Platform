from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator

# Allowed event types for UK Retail Banking and Fintech
ALLOWED_EVENT_TYPES: frozenset[str] = frozenset({
    # Onboarding / KYC (both sectors)
    "onboarding_started", "kyc_initiated", "kyc_document_uploaded",
    "kyc_completed", "kyc_failed", "account_opened", "account_rejected",
    # Transactions / Activity (both sectors)
    "login", "payment_initiated", "payment_completed", "payment_failed",
    "transfer_initiated", "transfer_completed", "beneficiary_added",
    # UK Retail Banking specific
    "open_banking_consent_given", "direct_debit_setup", "standing_order_created",
    "branch_visit", "call_centre_contact", "loan_application_started",
    "loan_application_completed", "loan_application_rejected", "card_activated",
    # UK Fintech specific
    "feature_discovered", "feature_activated", "subscription_started",
    "subscription_cancelled", "referral_sent", "referral_converted",
    "notification_opted_in", "biometric_enrolled",
    # Fallback
    "other",
})


class SaleRecord(BaseModel):
    external_id: str
    product_id: str | None = None
    customer_id: str | None = None
    amount: float = Field(gt=0)
    currency: str = "GBP"
    quantity: int = Field(default=1, gt=0)
    transaction_at: datetime
    metadata: dict[str, Any] = {}


class ProductRecord(BaseModel):
    external_id: str
    name: str
    category: str | None = None
    price: float | None = None
    currency: str = "GBP"
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
    event_type: str
    product_id: str | None = None
    occurred_at: datetime
    properties: dict[str, Any] = {}

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        if v not in ALLOWED_EVENT_TYPES:
            raise ValueError(
                f"event_type '{v}' is not allowed. "
                f"Must be one of: {', '.join(sorted(ALLOWED_EVENT_TYPES))}"
            )
        return v


class FeedbackRecord(BaseModel):
    external_id: str | None = None
    customer_id: str | None = None
    product_id: str | None = None
    text: str = Field(min_length=1, max_length=10000)
    rating: int | None = Field(default=None, ge=1, le=5)
    source: Literal[
        "website", "email", "survey", "app",
        "branch", "call_centre", "chatbot", "nps_survey", "social_media",
        "other",
    ] = "website"
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
