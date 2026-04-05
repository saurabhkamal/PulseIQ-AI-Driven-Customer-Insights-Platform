"""
FastAPI dependency that extracts and validates the JWT from the Authorization header.
Returns a CurrentUser dataclass with user_id, org_id, and role.
"""
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.exceptions import UnauthorizedError, ForbiddenError
from core.security import decode_token
from core.logging import get_logger
from jose import JWTError

logger = get_logger(__name__)
_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    org_id: str
    role: str


def _extract(
    credentials: HTTPAuthorizationCredentials | None,
) -> CurrentUser:
    if not credentials:
        raise UnauthorizedError("Missing Authorization header")
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Token is not an access token")

    return CurrentUser(
        user_id=payload["sub"],
        org_id=payload["org_id"],
        role=payload["role"],
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> CurrentUser:
    return _extract(credentials)


def require_roles(*roles: str):
    """Return a dependency that allows only the specified roles."""
    def _check(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.role not in roles:
            raise ForbiddenError(f"Role '{user.role}' is not allowed for this endpoint")
        return user
    return _check


def require_admin(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if user.role != "admin":
        raise ForbiddenError("Admin role required")
    return user


def require_analyst_or_above(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if user.role not in ("admin", "analyst"):
        raise ForbiddenError("Analyst or Admin role required")
    return user


# Type aliases for convenience
AdminUser = Annotated[CurrentUser, Depends(require_admin)]
AnyUser = Annotated[CurrentUser, Depends(get_current_user)]
