from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.order import Order
from models.order_item import OrderItem
from models.order_item_ingredient import OrderItemIngredient
from schemas.order import OrderCreate, OrderUpdate


async def get_orders(db: AsyncSession) -> list[Order]:
    result = await db.execute(select(Order).order_by(Order.id))
    return list(result.scalars().all())


async def get_orders_with_details(db: AsyncSession) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.location),
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.items)
            .selectinload(OrderItem.ingredients)
            .selectinload(OrderItemIngredient.ingredient),
            selectinload(Order.shipping),
        )
        .order_by(Order.id)
    )
    return list(result.scalars().all())


async def get_order(db: AsyncSession, order_id: int) -> Order | None:
    return await db.get(Order, order_id)


async def get_order_with_details(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.location),
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.items)
            .selectinload(OrderItem.ingredients)
            .selectinload(OrderItemIngredient.ingredient),
            selectinload(Order.shipping),
        )
    )
    return result.scalar_one_or_none()


async def get_user_orders(db: AsyncSession, user_id: int) -> list[Order]:
    result = await db.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.id)
    )
    return list(result.scalars().all())


async def create_order(db: AsyncSession, order_data: OrderCreate) -> Order:
    data = order_data.model_dump()
    items_data = data.pop("items")
    order = Order(**data)

    for item_data in items_data:
        ingredients_data = item_data.pop("ingredients")
        item = OrderItem(**item_data)
        item.ingredients = [
            OrderItemIngredient(**ingredient_data)
            for ingredient_data in ingredients_data
        ]
        order.items.append(item)

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


async def update_order(db: AsyncSession, order: Order, order_data: OrderUpdate) -> Order:
    update_data = order_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    await db.commit()
    await db.refresh(order)
    return order


async def delete_order(db: AsyncSession, order: Order) -> None:
    await db.delete(order)
    await db.commit()
