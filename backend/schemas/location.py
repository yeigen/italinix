from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LocationBase(BaseModel):
    location: str
    city: str
    indications: str | None = None
    is_principal: bool = False


class LocationCreate(LocationBase):
    user_id: int


class LocationUpdate(BaseModel):
    location: str | None = None
    city: str | None = None
    indications: str | None = None
    is_principal: bool | None = None


class LocationRead(LocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    create_date: datetime
