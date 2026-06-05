from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from schemas.category import CategoryRead
from schemas.ingredient import IngredientRead


class ProductBase(BaseModel):
    category_id: int
    name: str
    description: str | None = None
    price: Decimal
    image_url: str | None = None
    available: bool = True


class ProductCreate(ProductBase):
    ingredient_ids: list[int] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    image_url: str | None = None
    available: bool | None = None
    ingredient_ids: list[int] | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ProductDetailRead(ProductRead):
    category: CategoryRead
    ingredients: list[IngredientRead] = Field(default_factory=list)
