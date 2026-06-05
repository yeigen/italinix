from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from schemas.order_item_ingredient import (
    OrderItemIngredientCreate,
    OrderItemIngredientDetailRead,
)
from schemas.product import ProductRead


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    unit_price: Decimal
    notes: str | None = None


class OrderItemCreate(OrderItemBase):
    ingredients: list[OrderItemIngredientCreate] = Field(default_factory=list)


class OrderItemUpdate(BaseModel):
    quantity: int | None = None
    unit_price: Decimal | None = None
    notes: str | None = None


class OrderItemRead(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int


class OrderItemDetailRead(OrderItemRead):
    product: ProductRead
    ingredients: list[OrderItemIngredientDetailRead] = Field(default_factory=list)
