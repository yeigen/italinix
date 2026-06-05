from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.shipping import Shipping
from schemas.shipping import ShippingCreate, ShippingUpdate


async def get_shippings(db: AsyncSession) -> list[Shipping]:
    result = await db.execute(select(Shipping).order_by(Shipping.id))
    return list(result.scalars().all())


async def get_shipping(db: AsyncSession, shipping_id: int) -> Shipping | None:
    return await db.get(Shipping, shipping_id)


async def get_shipping_by_order(db: AsyncSession, order_id: int) -> Shipping | None:
    result = await db.execute(select(Shipping).where(Shipping.order_id == order_id))
    return result.scalar_one_or_none()


async def get_delivery_person_shippings(
    db: AsyncSession, delivery_person_id: int
) -> list[Shipping]:
    result = await db.execute(
        select(Shipping)
        .where(Shipping.delivery_person_id == delivery_person_id)
        .order_by(Shipping.id)
    )
    return list(result.scalars().all())


async def create_shipping(db: AsyncSession, shipping_data: ShippingCreate) -> Shipping:
    shipping = Shipping(**shipping_data.model_dump())
    db.add(shipping)
    await db.commit()
    await db.refresh(shipping)
    return shipping


async def update_shipping(
    db: AsyncSession, shipping: Shipping, shipping_data: ShippingUpdate
) -> Shipping:
    update_data = shipping_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shipping, field, value)

    await db.commit()
    await db.refresh(shipping)
    return shipping


async def delete_shipping(db: AsyncSession, shipping: Shipping) -> None:
    await db.delete(shipping)
    await db.commit()
