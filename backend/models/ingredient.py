from __future__ import annotations
from decimal import Decimal
from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
from models.product_ingredient import ProductIngredient
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.product import Product


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    additional_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0, server_default="0"
    )

    products: Mapped[list["Product"]] = relationship(
        secondary=ProductIngredient.__table__, back_populates="ingredients"
    )
