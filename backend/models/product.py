from __future__ import annotations
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
from models.product_ingredient import ProductIngredient

if TYPE_CHECKING:
    from models.category import Category
    from models.ingredient import Ingredient


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    image_url: Mapped[str | None] = mapped_column(String(500))
    available: Mapped[bool] = mapped_column(default=True, server_default="true")

    category: Mapped[Category] = relationship(back_populates="products")
    ingredients: Mapped[list[Ingredient]] = relationship(
        secondary=ProductIngredient.__table__, back_populates="products"
    )
