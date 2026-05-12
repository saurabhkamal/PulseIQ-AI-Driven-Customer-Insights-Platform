from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.mobile import DeviceToken, MobileNotification, MobilePreference
from .base import BaseRepository


class DeviceTokenRepository(BaseRepository[DeviceToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DeviceToken, session)

    async def get_by_user_and_endpoint(
        self, user_id: str, endpoint: str, org_id: str
    ) -> DeviceToken | None:
        result = await self.session.execute(
            select(DeviceToken).where(
                DeviceToken.organization_id == org_id,
                DeviceToken.user_id == user_id,
                DeviceToken.endpoint == endpoint,
            )
        )
        return result.scalar_one_or_none()

    async def get_active_by_org(self, org_id: str) -> list[DeviceToken]:
        result = await self.session.execute(
            select(DeviceToken).where(
                DeviceToken.organization_id == org_id,
                DeviceToken.is_active == True,  # noqa: E712
            )
        )
        return list(result.scalars().all())


class NotificationRepository(BaseRepository[MobileNotification]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(MobileNotification, session)

    async def get_by_user(
        self, user_id: str, org_id: str, offset: int = 0, limit: int = 50
    ) -> tuple[list[MobileNotification], int]:
        return await self.list(
            MobileNotification.organization_id == org_id,
            MobileNotification.user_id == user_id,
            offset=offset,
            limit=limit,
            order_by=MobileNotification.sent_at.desc(),
        )

    async def mark_read(self, notification_id: str, user_id: str) -> None:
        await self.session.execute(
            update(MobileNotification)
            .where(
                MobileNotification.id == notification_id,
                MobileNotification.user_id == user_id,
            )
            .values(is_read=True)
        )
