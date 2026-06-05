from __future__ import annotations
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base

if TYPE_CHECKING:
    from models.ingredient import Ingredient
    from models.order_item import OrderItem


class OrderItemIngredient(Base):
    __tablename__ = "order_item_ingredients"

    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"), primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
    additional_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order_item: Mapped[OrderItem] = relationship(back_populates="ingredients")
    ingredient: Mapped[Ingredient] = relationship()
