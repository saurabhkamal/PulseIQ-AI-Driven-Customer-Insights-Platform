from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import NotFoundError, ConflictError, ForbiddenError
from core.security import hash_password
from core.logging import get_logger
from models.user import User
from repositories.users import UserRepository
from repositories.audit import AuditRepository
from schemas.user import UserCreate, UserUpdate, UserResponse
from schemas.common import PaginatedResponse, PaginationMeta

logger = get_logger(__name__)


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.users = UserRepository(session)
        self.audit = AuditRepository(session)

    async def list_users(
        self, org_id: str, page: int = 1, page_size: int = 20
    ) -> PaginatedResponse[UserResponse]:
        offset = (page - 1) * page_size
        rows, total = await self.users.get_by_org(org_id, offset=offset, limit=page_size)
        import math
        return PaginatedResponse(
            data=[UserResponse.model_validate(u) for u in rows],
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=math.ceil(total / page_size),
            ),
        )

    async def create_user(
        self, org_id: str, data: UserCreate, created_by_id: str
    ) -> UserResponse:
        existing = await self.users.get_by_email(data.email)
        if existing:
            raise ConflictError(f"A user with email {data.email} already exists")

        # Generate a temp password — user should reset via SSO or password reset flow
        temp_password = hash_password("ChangeMe123!")
        user = User(
            organization_id=org_id,
            email=data.email,
            name=data.name,
            role=data.role,
            hashed_password=temp_password,
        )
        user = await self.users.create(user)

        await self.audit.log(
            org_id=org_id,
            action="user.created",
            user_id=created_by_id,
            entity_type="user",
            entity_id=user.id,
        )
        logger.info("user_created", user_id=user.id, org_id=org_id, role=data.role)
        return UserResponse.model_validate(user)

    async def update_user(
        self, org_id: str, user_id: str, data: UserUpdate, updated_by_id: str
    ) -> UserResponse:
        user = await self.users.get_by_id(user_id)
        if not user or user.organization_id != org_id:
            raise NotFoundError("User not found")

        if data.name is not None:
            user.name = data.name
        if data.role is not None:
            user.role = data.role

        await self.audit.log(
            org_id=org_id, action="user.updated", user_id=updated_by_id,
            entity_type="user", entity_id=user_id,
        )
        return UserResponse.model_validate(user)

    async def deactivate_user(
        self, org_id: str, user_id: str, deactivated_by_id: str
    ) -> None:
        user = await self.users.get_by_id(user_id)
        if not user or user.organization_id != org_id:
            raise NotFoundError("User not found")
        if user_id == deactivated_by_id:
            raise ForbiddenError("Cannot deactivate your own account")

        await self.users.soft_delete(user)
        await self.audit.log(
            org_id=org_id, action="user.deactivated", user_id=deactivated_by_id,
            entity_type="user", entity_id=user_id,
        )
