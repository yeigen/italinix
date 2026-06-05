from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from models.order import OrderStatus
from schemas.location import LocationRead
from schemas.order_item import OrderItemCreate, OrderItemDetailRead
from schemas.shipping import ShippingRead


class OrderBase(BaseModel):
    user_id: int
    location_id: int | None = None
    status: OrderStatus = OrderStatus.PENDING
    total: Decimal
    notes: str | None = None


class OrderCreate(OrderBase):
    items: list[OrderItemCreate] = Field(default_factory=list)


class OrderUpdate(BaseModel):
    location_id: int | None = None
    status: OrderStatus | None = None
    total: Decimal | None = None
    notes: str | None = None


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class OrderDetailRead(OrderRead):
    location: LocationRead | None = None
    items: list[OrderItemDetailRead] = Field(default_factory=list)
    shipping: ShippingRead | None = None
