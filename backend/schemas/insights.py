from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

InsightType = Literal["marketing", "sales", "product", "retention"]
InsightPriority = Literal["high", "medium", "low"]


class InsightResponse(BaseModel):
    id: str
    type: InsightType
    priority: InsightPriority
    title: str
    description: str
    supporting_data: dict[str, Any]
    source_agent: str | None
    model_used: str | None
    generated_at: datetime
    expires_at: datetime | None

    model_config = {"from_attributes": True, "protected_namespaces": ()}
