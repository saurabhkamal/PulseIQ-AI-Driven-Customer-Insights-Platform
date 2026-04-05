"""
Authentication service — login, register, refresh, SSO token exchange.
"""
import re
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_password, hash_password, create_token_pair, decode_token
from core.exceptions import UnauthorizedError, ConflictError
from core.logging import get_logger
from models.organization import Organization
from models.user import User
from repositories.users import UserRepository
from schemas.auth import TokenResponse, UserInToken, RegisterRequest

logger = get_logger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)

    async def register(self, data: RegisterRequest) -> TokenResponse:
        """Create a new organization and admin user, return tokens."""
        existing = await self.users.get_by_email(data.email)
        if existing:
            raise ConflictError("An account with this email already exists")

        # Build a unique org slug
        slug_base = re.sub(r"[^a-z0-9]+", "-", data.organization_name.lower()).strip("-")
        slug = f"{slug_base}-{uuid4().hex[:6]}"

        org = Organization(name=data.organization_name, slug=slug)
        self.session.add(org)
        await self.session.flush()

        user = User(
            organization_id=org.id,
            email=data.email,
            name=data.name,
            role="admin",
            hashed_password=hash_password(data.password),
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        logger.info("user_registered", user_id=user.id, org_id=org.id)
        tokens = create_token_pair(user.id, org.id, user.role)
        return TokenResponse(
            **tokens,
            user=UserInToken(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                organization_id=org.id,
            ),
        )

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.users.get_by_email(email)
        if not user or not user.hashed_password:
            raise UnauthorizedError("Invalid credentials")
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials")
        if not user.is_active:
            raise UnauthorizedError("Account is deactivated")

        await self.users.update_last_login(user.id)
        logger.info("user_login", user_id=user.id, org_id=user.organization_id)

        tokens = create_token_pair(user.id, user.organization_id, user.role)
        return TokenResponse(
            **tokens,
            user=UserInToken(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                organization_id=user.organization_id,
            ),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        from jose import JWTError
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise UnauthorizedError("Token is not a refresh token")

        user = await self.users.get_by_id(payload["sub"])
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or deactivated")

        tokens = create_token_pair(user.id, user.organization_id, user.role)
        return TokenResponse(
            **tokens,
            user=UserInToken(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                organization_id=user.organization_id,
            ),
        )
