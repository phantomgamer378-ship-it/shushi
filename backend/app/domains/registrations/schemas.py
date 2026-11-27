from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class GoogleFormsWebhookPayload(BaseModel):
    response_id: str = Field(..., min_length=1, max_length=128, description="Stable Google Form response ID")
    name: str = Field(..., min_length=1, max_length=256)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=64)
    custom_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class RegistrationResponse(BaseModel):
    id: UUID
    event_id: UUID
    external_form_response_id: str
    attendee_name: str
    attendee_email: str
    attendee_phone: Optional[str]
    status: str
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketResponse(BaseModel):
    id: UUID
    event_id: UUID
    registration_id: UUID
    token_hash: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
