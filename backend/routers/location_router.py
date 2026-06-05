from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from schemas.location import LocationCreate, LocationRead, LocationUpdate
from services import location_service

router = APIRouter(prefix="/locations", tags=["locations"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/", response_model=list[LocationRead])
async def list_locations(db: DbSession):
    return await location_service.get_locations(db)


@router.get("/user/{user_id}", response_model=list[LocationRead])
async def list_user_locations(user_id: int, db: DbSession):
    return await location_service.get_user_locations(db, user_id)


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: int, db: DbSession):
    location = await location_service.get_location(db, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return location


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(location_data: LocationCreate, db: DbSession):
    return await location_service.create_location(db, location_data)


@router.patch("/{location_id}", response_model=LocationRead)
async def update_location(location_id: int, location_data: LocationUpdate, db: DbSession):
    location = await location_service.get_location(db, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return await location_service.update_location(db, location, location_data)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: int, db: DbSession):
    location = await location_service.get_location(db, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    await location_service.delete_location(db, location)
