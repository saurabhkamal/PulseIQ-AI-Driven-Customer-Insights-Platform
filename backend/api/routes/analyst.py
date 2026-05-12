"""
POST /api/v1/analyst/query — conversational AI analyst endpoint.
Accepts a natural-language question and returns an AI-generated answer
grounded in the organisation's data, with full guardrail audit logging.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import require_analyst_or_above, CurrentUser
from analyst.agent import AnalystAgent
from repositories.organizations import OrganizationRepository

router = APIRouter(prefix="/analyst", tags=["analyst"])


class AnalystQueryRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=2000)
    session_id: str | None = Field(default=None, max_length=128)


class AnalystQueryResponse(BaseModel):
    answer: str
    status: str
    tool_calls_made: int
    guardrail_triggered: str | None
    latency_ms: int | None


@router.post("/query", response_model=AnalystQueryResponse)
async def analyst_query(
    current_user: Annotated[CurrentUser, Depends(require_analyst_or_above)],
    db: Annotated[AsyncSession, Depends(get_db)],
    body: AnalystQueryRequest = Body(...),
) -> AnalystQueryResponse:
    """
    Ask the AI analyst a natural-language question about your organisation's data.
    The analyst autonomously decides which data to fetch and synthesises an answer.
    Every request is logged to ai_audit_logs regardless of outcome.
    """
    org_repo = OrganizationRepository(db)
    org = await org_repo.get_by_id(current_user.org_id)
    org_name = org.name if org else "Unknown Organisation"

    result = await AnalystAgent(db).query(
        user_input=body.question,
        org_id=current_user.org_id,
        org_name=org_name,
        user_id=current_user.user_id,
        user_role=current_user.role,
        session_id=body.session_id,
    )

    return AnalystQueryResponse(**result)
