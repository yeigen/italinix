from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from schemas.order import OrderCreate, OrderDetailRead, OrderRead, OrderUpdate
from services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/", response_model=list[OrderRead])
async def list_orders(db: DbSession):
    return await order_service.get_orders(db)


@router.get("/details", response_model=list[OrderDetailRead])
async def list_orders_with_details(db: DbSession):
    return await order_service.get_orders_with_details(db)


@router.get("/user/{user_id}", response_model=list[OrderRead])
async def list_user_orders(user_id: int, db: DbSession):
    return await order_service.get_user_orders(db, user_id)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, db: DbSession):
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.get("/{order_id}/details", response_model=OrderDetailRead)
async def get_order_with_details(order_id: int, db: DbSession):
    order = await order_service.get_order_with_details(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, db: DbSession):
    return await order_service.create_order(db, order_data)


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order(order_id: int, order_data: OrderUpdate, db: DbSession):
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return await order_service.update_order(db, order, order_data)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: int, db: DbSession):
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    await order_service.delete_order(db, order)
