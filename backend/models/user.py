from __future__ import annotations
import enum
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
from datetime import datetime

if TYPE_CHECKING:
    from models.location import Location
    from models.order import Order


class UserRole(str, enum.Enum):
    CLIENTE = "cliente"
    ADMIN = "admin"
    REPARTIDOR = "repartidor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    rol: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="tipo_rol",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=UserRole.CLIENTE,
        server_default=UserRole.CLIENTE.value,
    )
    active: Mapped[bool] = mapped_column(default=True, server_default="true")
    create_date: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    locations: Mapped[list[Location]] = relationship(back_populates="user")
    orders: Mapped[list[Order]] = relationship(back_populates="user")
