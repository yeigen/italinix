from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from schemas.shipping import ShippingCreate, ShippingRead, ShippingUpdate
from services import shipping_service

router = APIRouter(prefix="/shippings", tags=["shippings"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/", response_model=list[ShippingRead])
async def list_shippings(db: DbSession):
    return await shipping_service.get_shippings(db)


@router.get("/order/{order_id}", response_model=ShippingRead)
async def get_shipping_by_order(order_id: int, db: DbSession):
    shipping = await shipping_service.get_shipping_by_order(db, order_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")
    return shipping


@router.get("/delivery-person/{delivery_person_id}", response_model=list[ShippingRead])
async def list_delivery_person_shippings(delivery_person_id: int, db: DbSession):
    return await shipping_service.get_delivery_person_shippings(db, delivery_person_id)


@router.get("/{shipping_id}", response_model=ShippingRead)
async def get_shipping(shipping_id: int, db: DbSession):
    shipping = await shipping_service.get_shipping(db, shipping_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")
    return shipping


@router.post("/", response_model=ShippingRead, status_code=status.HTTP_201_CREATED)
async def create_shipping(shipping_data: ShippingCreate, db: DbSession):
    existing_shipping = await shipping_service.get_shipping_by_order(db, shipping_data.order_id)
    if existing_shipping is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order already has a shipping assigned",
        )
    return await shipping_service.create_shipping(db, shipping_data)


@router.patch("/{shipping_id}", response_model=ShippingRead)
async def update_shipping(
    shipping_id: int, shipping_data: ShippingUpdate, db: DbSession
):
    shipping = await shipping_service.get_shipping(db, shipping_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")
    return await shipping_service.update_shipping(db, shipping, shipping_data)


@router.delete("/{shipping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shipping(shipping_id: int, db: DbSession):
    shipping = await shipping_service.get_shipping(db, shipping_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")
    await shipping_service.delete_shipping(db, shipping)
