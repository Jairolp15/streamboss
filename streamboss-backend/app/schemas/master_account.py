from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.schemas.platform import PlatformResponse


class ProfileSlot(BaseModel):
    id: int
    profile_number: int
    pin: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    pin: Optional[str] = None


class MasterAccountBase(BaseModel):
    platform_id: int
    email: str
    password_encrypted: str
    purchase_date: date
    expiry_date: date
    total_profiles: int = 5
    notes: Optional[str] = None


class MasterAccountCreate(MasterAccountBase):
    pass


class MasterAccountUpdate(BaseModel):
    email: Optional[str] = None
    password_encrypted: Optional[str] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class MasterAccountResponse(BaseModel):
    id: int
    platform_id: int
    email: str
    purchase_date: date
    expiry_date: date
    total_profiles: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    platform: Optional[PlatformResponse] = None
    profiles: Optional[List[ProfileSlot]] = None
    days_until_expiry: Optional[int] = None
    occupied_count: Optional[int] = None
    available_count: Optional[int] = None

    model_config = {"from_attributes": True}
