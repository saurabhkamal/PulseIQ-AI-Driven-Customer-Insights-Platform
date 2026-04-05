from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from api.dependencies import AdminUser, AnyUser
from services.users import UserService
from schemas.user import UserCreate, UserUpdate, UserResponse
from schemas.common import PaginatedResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[UserResponse]:
    return await UserService(db).list_users(current_user.org_id, page, page_size)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    return await UserService(db).create_user(current_user.org_id, body, current_user.user_id)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    from core.exceptions import NotFoundError
    from repositories.users import UserRepository
    user = await UserRepository(db).get_by_id(user_id)
    if not user or user.organization_id != current_user.org_id:
        raise NotFoundError("User not found")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    return await UserService(db).update_user(current_user.org_id, user_id, body, current_user.user_id)


@router.delete("/{user_id}", status_code=204)
async def deactivate_user(
    user_id: str,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await UserService(db).deactivate_user(current_user.org_id, user_id, current_user.user_id)
