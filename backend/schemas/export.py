from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ExportType = Literal["behavior", "sentiment", "trends", "recommendations"]
ExportFormat = Literal["csv", "json", "pdf"]


class ExportRequest(BaseModel):
    type: ExportType
    format: ExportFormat
    start_date: datetime
    end_date: datetime


class ExportResponse(BaseModel):
    export_id: str
    status: str
    download_url: str | None = None
    expires_at: datetime | None = None
