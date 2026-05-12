from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

InsightPriority = Literal["high", "medium", "low"]


class InsightResponse(BaseModel):
    id: str
    type: str  # open string — agent types exceed the original 4-value enum
    priority: InsightPriority
    title: str
    description: str
    supporting_data: dict[str, Any]
    source_agent: str | None
    model_used: str | None
    generated_at: datetime
    expires_at: datetime | None

    model_config = {"from_attributes": True, "protected_namespaces": ()}
