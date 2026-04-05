from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import NotFoundError
from core.logging import get_logger
from repositories.mobile import DeviceTokenRepository, NotificationRepository
from models.mobile import DeviceToken
from schemas.mobile import DeviceTokenRequest, DeviceTokenResponse, NotificationResponse

logger = get_logger(__name__)


class MobileService:
    def __init__(self, session: AsyncSession) -> None:
        self.tokens = DeviceTokenRepository(session)
        self.notifications = NotificationRepository(session)

    async def register_device(
        self, user_id: str, org_id: str, req: DeviceTokenRequest
    ) -> DeviceTokenResponse:
        existing = await self.tokens.get_by_user_and_endpoint(user_id, req.endpoint)
        if existing:
            existing.p256dh_key = req.keys.get("p256dh", "")
            existing.auth_key = req.keys.get("auth", "")
            existing.is_active = True
            existing.last_used_at = datetime.now(timezone.utc)
            token = existing
        else:
            token = DeviceToken(
                user_id=user_id,
                organization_id=org_id,
                endpoint=req.endpoint,
                p256dh_key=req.keys.get("p256dh", ""),
                auth_key=req.keys.get("auth", ""),
                device_id=req.device_id,
            )
            token = await self.tokens.create(token)

        logger.info("device_registered", user_id=user_id, org_id=org_id)
        return DeviceTokenResponse(id=token.id, registered_at=token.created_at)

    async def get_notifications(self, user_id: str) -> list[NotificationResponse]:
        rows, _ = await self.notifications.get_by_user(user_id, limit=50)
        return [NotificationResponse.model_validate(r) for r in rows]

    async def mark_notification_read(self, notification_id: str, user_id: str) -> None:
        await self.notifications.mark_read(notification_id, user_id)
