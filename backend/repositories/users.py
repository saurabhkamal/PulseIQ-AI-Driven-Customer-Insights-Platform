from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_org(self, org_id: str, offset: int = 0, limit: int = 20) -> tuple[list[User], int]:
        return await self.list(
            User.organization_id == org_id,
            User.deleted_at.is_(None),
            offset=offset,
            limit=limit,
            order_by=User.created_at.desc(),
        )

    async def soft_delete(self, user: User) -> None:
        from datetime import datetime, timezone
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        await self.session.flush()

    async def update_last_login(self, user_id: str) -> None:
        from datetime import datetime, timezone
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(timezone.utc))
        )
