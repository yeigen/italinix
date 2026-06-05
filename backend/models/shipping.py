from __future__ import annotations
import enum
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
from datetime import datetime

if TYPE_CHECKING:
    from models.order import Order
    from models.user import User


class ShippingStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"


class Shipping(Base):
    __tablename__ = "shippings"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), unique=True)
    delivery_person_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[ShippingStatus] = mapped_column(
        Enum(
            ShippingStatus,
            name="shipping_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=ShippingStatus.ASSIGNED,
        server_default=ShippingStatus.ASSIGNED.value,
    )
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    order: Mapped[Order] = relationship(back_populates="shipping")
    delivery_person: Mapped[User] = relationship()
