from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.user import UserRole


class UserBase(BaseModel):
    name: str
    email: str
    phone: str | None = None
    rol: UserRole = UserRole.CLIENTE
    active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    phone: str | None = None
    rol: UserRole | None = None
    active: bool | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    create_date: datetime
