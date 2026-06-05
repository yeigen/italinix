from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from schemas.ingredient import IngredientRead


class OrderItemIngredientBase(BaseModel):
    ingredient_id: int
    additional_price: Decimal


class OrderItemIngredientCreate(OrderItemIngredientBase):
    pass


class OrderItemIngredientRead(OrderItemIngredientBase):
    model_config = ConfigDict(from_attributes=True)

    order_item_id: int

class OrderItemIngredientDetailRead(OrderItemIngredientRead):
    ingredient: IngredientRead
