from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.platform import PlatformResponse


class IssueReportCreate(BaseModel):
    client_name: str
    phone_whatsapp: Optional[str] = None
    platform_id: int
    email: str
    password: str
    notes: str


class IssueReportUpdate(BaseModel):
    status: str          # resolved | rejected
    admin_note: Optional[str] = None


class IssueReportResponse(BaseModel):
    id: int
    client_name: str
    phone_whatsapp: Optional[str] = None
    platform_id: int
    email: str
    password: str
    notes: str
    admin_note: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    platform: Optional[PlatformResponse] = None

    model_config = {"from_attributes": True}
