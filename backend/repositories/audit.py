from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from models.audit import AuditLog
from .base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AuditLog, session)

    async def log(
        self,
        org_id: str,
        action: str,
        user_id: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            organization_id=org_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_=metadata or {},
            occurred_at=datetime.now(timezone.utc),
        )
        return await self.create(entry)

    async def get_by_org(
        self, org_id: str, offset: int = 0, limit: int = 50
    ) -> tuple[list[AuditLog], int]:
        return await self.list(
            AuditLog.organization_id == org_id,
            offset=offset,
            limit=limit,
            order_by=AuditLog.occurred_at.desc(),
        )
