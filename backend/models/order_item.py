from __future__ import annotations
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import Numeric, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base

if TYPE_CHECKING:
    from models.order import Order
    from models.product import Product
    from models.order_item_ingredient import OrderItemIngredient


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(default=1, server_default="1")
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text)

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()
    ingredients: Mapped[list["OrderItemIngredient"]] = relationship(back_populates="order_item")
