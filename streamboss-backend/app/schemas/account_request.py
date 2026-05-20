from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.platform import PlatformResponse


class AccountRequestCreate(BaseModel):
    platform_id: int
    notes: Optional[str] = None


class AccountRequestUpdate(BaseModel):
    status: str  # approved | rejected
    notes: Optional[str] = None


class AccountRequestResponse(BaseModel):
    id: int
    distributor_id: int
    platform_id: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    distributor_name: Optional[str] = None
    platform: Optional[PlatformResponse] = None

    model_config = {"from_attributes": True}
