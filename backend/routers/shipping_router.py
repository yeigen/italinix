from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import get_current_active_user, require_admin
from models.shipping import Shipping
from models.user import User, UserRole
from schemas.shipping import ShippingCreate, ShippingRead, ShippingUpdate
from services import order_service, shipping_service, user_service

router = APIRouter(prefix="/shippings", tags=["shippings"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(require_admin)]


async def ensure_shipping_access(
    shipping: Shipping, db: DbSession, current_user: User
) -> None:
    if current_user.rol == UserRole.ADMIN:
        return

    if (
        current_user.rol == UserRole.REPARTIDOR
        and shipping.delivery_person_id == current_user.id
    ):
        return

    order = await order_service.get_order(db, shipping.order_id)
    if order is not None and order.user_id == current_user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Shipping access denied",
    )


async def validate_shipping_assignment(
    db: DbSession, order_id: int, delivery_person_id: int
) -> None:
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found",
        )

    delivery_person = await user_service.get_user(db, delivery_person_id)
    if delivery_person is None or delivery_person.rol != UserRole.REPARTIDOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery person not found",
        )


@router.get("/", response_model=list[ShippingRead])
async def list_shippings(db: DbSession, _: AdminUser):
    return await shipping_service.get_shippings(db)


@router.get("/order/{order_id}", response_model=ShippingRead)
async def get_shipping_by_order(order_id: int, db: DbSession, current_user: CurrentUser):
    shipping = await shipping_service.get_shipping_by_order(db, order_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")

    await ensure_shipping_access(shipping, db, current_user)
    return shipping


@router.get("/delivery-person/{delivery_person_id}", response_model=list[ShippingRead])
async def list_delivery_person_shippings(
    delivery_person_id: int, db: DbSession, current_user: CurrentUser
):
    if current_user.rol != UserRole.ADMIN and current_user.id != delivery_person_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shipping access denied",
        )

    return await shipping_service.get_delivery_person_shippings(db, delivery_person_id)


@router.get("/{shipping_id}", response_model=ShippingRead)
async def get_shipping(shipping_id: int, db: DbSession, current_user: CurrentUser):
    shipping = await shipping_service.get_shipping(db, shipping_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")

    await ensure_shipping_access(shipping, db, current_user)
    return shipping


@router.post("/", response_model=ShippingRead, status_code=status.HTTP_201_CREATED)
async def create_shipping(shipping_data: ShippingCreate, db: DbSession, _: AdminUser):
    await validate_shipping_assignment(
        db, shipping_data.order_id, shipping_data.delivery_person_id
    )

    existing_shipping = await shipping_service.get_shipping_by_order(db, shipping_data.order_id)
    if existing_shipping is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order already has a shipping assigned",
        )
    return await shipping_service.create_shipping(db, shipping_data)


@router.patch("/{shipping_id}", response_model=ShippingRead)
async def update_shipping(
    shipping_id: int, shipping_data: ShippingUpdate, db: DbSession, current_user: CurrentUser
):
    shipping = await shipping_service.get_shipping(db, shipping_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")

    if current_user.rol == UserRole.REPARTIDOR:
        if shipping.delivery_person_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shipping access denied",
            )

        if shipping_data.delivery_person_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Delivery person cannot be reassigned",
            )
    elif current_user.rol != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shipping access denied",
        )

    if shipping_data.delivery_person_id is not None:
        await validate_shipping_assignment(
            db, shipping.order_id, shipping_data.delivery_person_id
        )

    return await shipping_service.update_shipping(db, shipping, shipping_data)


@router.delete("/{shipping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shipping(shipping_id: int, db: DbSession, _: AdminUser):
    shipping = await shipping_service.get_shipping(db, shipping_id)
    if shipping is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping not found")
    await shipping_service.delete_shipping(db, shipping)
