from __future__ import annotations
import enum
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
from datetime import datetime

if TYPE_CHECKING:
    from models.user import User
    from models.location import Location
    from models.order_item import OrderItem
    from models.shipping import Shipping


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"))
    status: Mapped[OrderStatus] = mapped_column(
        Enum(
            OrderStatus,
            name="order_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=OrderStatus.PENDING,
        server_default=OrderStatus.PENDING.value,
    )
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="orders")
    location: Mapped[Location | None] = relationship()
    items: Mapped[list[OrderItem]] = relationship(back_populates="order")
    shipping: Mapped[Shipping | None] = relationship(back_populates="order")
