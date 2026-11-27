from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class EventCreate(BaseModel):
    slug: str = Field(..., min_length=3, max_length=128, pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=3, max_length=256)
    description: Optional[str] = Field(default=None)
    venue_name: str = Field(..., min_length=2, max_length=256)
    start_time: datetime
    end_time: datetime
    timezone: str = Field(default="Asia/Kolkata", max_length=64)
    max_capacity: Optional[int] = Field(default=None, ge=1)

    model_config = ConfigDict(from_attributes=True)


class EventResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    description: Optional[str]
    venue_name: str
    start_time: datetime
    end_time: datetime
    timezone: str
    max_capacity: Optional[int]
    status: str
    webhook_secret: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventSummary(BaseModel):
    id: UUID
    slug: str
    title: str
    venue_name: str
    start_time: datetime
    end_time: datetime
    status: str
    user_role: str

    model_config = ConfigDict(from_attributes=True)
