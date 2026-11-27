"""
All EventFlow SQLAlchemy ORM Models.
Imported here to populate Base.metadata for Alembic migrations.
"""
from app.core.database import Base
from app.domains.events.models import Event
from app.domains.staff.models import EventStaff
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.checkin.models import ScannerDevice, CheckIn
from app.domains.webhooks.models import WebhookReceipt
from app.domains.email.models import EmailOutbox
from app.domains.audit.models import AuditLog

__all__ = [
    "Base",
    "Event",
    "EventStaff",
    "Registration",
    "Ticket",
    "ScannerDevice",
    "CheckIn",
    "WebhookReceipt",
    "EmailOutbox",
    "AuditLog",
]
