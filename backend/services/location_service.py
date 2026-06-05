from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.location import Location
from schemas.location import LocationCreate, LocationUpdate


async def get_locations(db: AsyncSession) -> list[Location]:
    result = await db.execute(select(Location).order_by(Location.id))
    return list(result.scalars().all())


async def get_location(db: AsyncSession, location_id: int) -> Location | None:
    return await db.get(Location, location_id)


async def get_user_locations(db: AsyncSession, user_id: int) -> list[Location]:
    result = await db.execute(
        select(Location).where(Location.user_id == user_id).order_by(Location.id)
    )
    return list(result.scalars().all())


async def create_location(db: AsyncSession, location_data: LocationCreate) -> Location:
    location = Location(**location_data.model_dump())
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def update_location(
    db: AsyncSession, location: Location, location_data: LocationUpdate
) -> Location:
    update_data = location_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)

    await db.commit()
    await db.refresh(location)
    return location


async def delete_location(db: AsyncSession, location: Location) -> None:
    await db.delete(location)
    await db.commit()
