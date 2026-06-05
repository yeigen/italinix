from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import get_current_active_user, require_admin
from models.location import Location
from models.user import User, UserRole
from schemas.location import LocationCreate, LocationRead, LocationUpdate
from services import location_service

router = APIRouter(prefix="/locations", tags=["locations"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(require_admin)]


def ensure_location_owner_or_admin(location: Location, current_user: User) -> None:
    if current_user.rol == UserRole.ADMIN or location.user_id == current_user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Location access denied",
    )


@router.get("/", response_model=list[LocationRead])
async def list_locations(db: DbSession, _: AdminUser):
    return await location_service.get_locations(db)


@router.get("/user/{user_id}", response_model=list[LocationRead])
async def list_user_locations(user_id: int, db: DbSession, current_user: CurrentUser):
    if current_user.rol != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Location access denied",
        )

    return await location_service.get_user_locations(db, user_id)


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: int, db: DbSession, current_user: CurrentUser):
    location = await location_service.get_location(db, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    ensure_location_owner_or_admin(location, current_user)
    return location


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(location_data: LocationCreate, db: DbSession, current_user: CurrentUser):
    if current_user.rol != UserRole.ADMIN and location_data.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create locations for another user",
        )

    return await location_service.create_location(db, location_data)


@router.patch("/{location_id}", response_model=LocationRead)
async def update_location(
    location_id: int, location_data: LocationUpdate, db: DbSession, current_user: CurrentUser
):
    location = await location_service.get_location(db, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    ensure_location_owner_or_admin(location, current_user)
    return await location_service.update_location(db, location, location_data)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: int, db: DbSession, current_user: CurrentUser):
    location = await location_service.get_location(db, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    ensure_location_owner_or_admin(location, current_user)
    await location_service.delete_location(db, location)
