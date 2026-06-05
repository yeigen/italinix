from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base
from datetime import datetime

if TYPE_CHECKING:
    from models.user import User


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    location: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))
    indications: Mapped[str | None] = mapped_column(Text)
    is_principal: Mapped[bool] = mapped_column(default=False, server_default="false")
    create_date: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="locations")
