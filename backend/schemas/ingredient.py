from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class IngredientBase(BaseModel):
    name: str
    additional_price: Decimal = Decimal("0")


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: str | None = None
    additional_price: Decimal | None = None


class IngredientRead(IngredientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
