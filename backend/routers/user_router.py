from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import get_current_active_user, require_admin
from models.user import User, UserRole
from schemas.user import UserCreate, UserRead, UserUpdate
from services import user_service

router = APIRouter(prefix="/users", tags=["users"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(require_admin)]


def ensure_user_owner_or_admin(user_id: int, current_user: User) -> None:
    if current_user.rol == UserRole.ADMIN or current_user.id == user_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="User access denied",
    )


def ensure_allowed_self_update(user_data: UserUpdate, current_user: User) -> None:
    if current_user.rol == UserRole.ADMIN:
        return

    if user_data.rol is not None or user_data.active is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update role or active status",
        )


@router.get("/", response_model=list[UserRead])
async def list_users(db: DbSession, _: AdminUser):
    return await user_service.get_users(db)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: int, db: DbSession, current_user: CurrentUser):
    ensure_user_owner_or_admin(user_id, current_user)

    user = await user_service.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db: DbSession):
    if user_data.rol != UserRole.CLIENTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration only supports cliente role",
        )

    existing_user = await user_service.get_user_by_email(db, user_data.email)
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    return await user_service.create_user(db, user_data)


@router.post("/admin", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_as_admin(user_data: UserCreate, db: DbSession, _: AdminUser):
    existing_user = await user_service.get_user_by_email(db, user_data.email)
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    return await user_service.create_user(db, user_data)


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(user_id: int, user_data: UserUpdate, db: DbSession, current_user: CurrentUser):
    ensure_user_owner_or_admin(user_id, current_user)
    ensure_allowed_self_update(user_data, current_user)

    user = await user_service.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_data.email is not None and user_data.email != user.email:
        existing_user = await user_service.get_user_by_email(db, user_data.email)
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    return await user_service.update_user(db, user, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: DbSession, _: AdminUser):
    user = await user_service.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await user_service.delete_user(db, user)
