from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.shipping import ShippingStatus


class ShippingBase(BaseModel):
    order_id: int
    delivery_person_id: int
    status: ShippingStatus = ShippingStatus.ASSIGNED


class ShippingCreate(ShippingBase):
    pass


class ShippingUpdate(BaseModel):
    delivery_person_id: int | None = None
    status: ShippingStatus | None = None
    delivered_at: datetime | None = None


class ShippingRead(ShippingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    delivered_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
