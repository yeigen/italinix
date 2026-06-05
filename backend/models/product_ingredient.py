from __future__ import annotations
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
