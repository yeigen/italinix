from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import get_current_active_user, require_admin
from models.order import Order
from models.user import User, UserRole
from schemas.order import OrderCreate, OrderDetailRead, OrderRead, OrderUpdate
from services import location_service, order_service, shipping_service

router = APIRouter(prefix="/orders", tags=["orders"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(require_admin)]


async def ensure_order_read_access(order: Order, db: DbSession, current_user: User) -> None:
    if current_user.rol == UserRole.ADMIN or order.user_id == current_user.id:
        return

    shipping = await shipping_service.get_shipping_by_order(db, order.id)
    if (
        current_user.rol == UserRole.REPARTIDOR
        and shipping is not None
        and shipping.delivery_person_id == current_user.id
    ):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Order access denied",
    )


@router.get("/", response_model=list[OrderRead])
async def list_orders(db: DbSession, _: AdminUser):
    return await order_service.get_orders(db)


@router.get("/details", response_model=list[OrderDetailRead])
async def list_orders_with_details(db: DbSession, _: AdminUser):
    return await order_service.get_orders_with_details(db)


@router.get("/user/{user_id}", response_model=list[OrderRead])
async def list_user_orders(user_id: int, db: DbSession, current_user: CurrentUser):
    if current_user.rol != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Order access denied",
        )

    return await order_service.get_user_orders(db, user_id)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, db: DbSession, current_user: CurrentUser):
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    await ensure_order_read_access(order, db, current_user)
    return order


@router.get("/{order_id}/details", response_model=OrderDetailRead)
async def get_order_with_details(order_id: int, db: DbSession, current_user: CurrentUser):
    order = await order_service.get_order_with_details(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    await ensure_order_read_access(order, db, current_user)
    return order


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, db: DbSession, current_user: CurrentUser):
    if current_user.rol != UserRole.ADMIN and order_data.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create orders for another user",
        )

    if order_data.location_id is not None:
        location = await location_service.get_location(db, order_data.location_id)
        if location is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location not found",
            )

        if location.user_id != order_data.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Location does not belong to order user",
            )

    return await order_service.create_order(db, order_data)


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order(order_id: int, order_data: OrderUpdate, db: DbSession, _: AdminUser):
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return await order_service.update_order(db, order, order_data)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: int, db: DbSession, _: AdminUser):
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    await order_service.delete_order(db, order)
