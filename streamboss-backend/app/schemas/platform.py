from pydantic import BaseModel
from typing import Optional


class PlatformBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    max_profiles: int = 5
    color_hex: str = "#6366f1"


class PlatformCreate(PlatformBase):
    pass


class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    max_profiles: Optional[int] = None
    color_hex: Optional[str] = None


class PlatformResponse(PlatformBase):
    id: int

    model_config = {"from_attributes": True}
