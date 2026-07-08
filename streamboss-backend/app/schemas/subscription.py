from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class SubscriptionCreate(BaseModel):
    client_id: int
    profile_id: int
    start_date: date
    end_date: date


class SubscriptionUpdate(BaseModel):
    end_date: Optional[date] = None
    status: Optional[str] = None


class SubscriptionEdit(BaseModel):
    end_date: Optional[date] = None
    profile_pin: Optional[str] = None
    master_email: Optional[str] = None
    master_password: Optional[str] = None
    profile_id: Optional[int] = None  # Para cambiar el perfil asignado al cliente


class SubscriptionResponse(BaseModel):
    id: int
    client_id: int
    profile_id: int
    distributor_id: int
    start_date: date
    end_date: date
    status: str
    renewal_notified: bool
    created_at: datetime
    days_remaining: Optional[int] = None
    # Enriched fields
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    device_type: Optional[str] = None
    platform_name: Optional[str] = None
    platform_color: Optional[str] = None
    profile_number: Optional[int] = None
    profile_pin: Optional[str] = None
    master_email: Optional[str] = None
    master_password: Optional[str] = None

    model_config = {"from_attributes": True}


class WhatsAppMessage(BaseModel):
    phone: str
    message: str
    wa_link: str
