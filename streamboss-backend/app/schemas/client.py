from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClientBase(BaseModel):
    full_name: str
    phone_whatsapp: Optional[str] = None
    device_type: str = "phone"  # phone | laptop | tv


class ClientCreate(ClientBase):
    distributor_id: Optional[int] = None  # filled from JWT when distributor


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_whatsapp: Optional[str] = None
    device_type: Optional[str] = None


class ClientResponse(ClientBase):
    id: int
    distributor_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
