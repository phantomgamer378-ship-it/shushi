import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    CheckConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="RESTRICT"), nullable=False)
    external_form_response_id = Column(String(128), nullable=False)
    attendee_name = Column(String(256), nullable=False)
    attendee_email = Column(String(256), nullable=False)
    attendee_phone = Column(String(64), nullable=True)
    urn = Column(String(64), nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=False, default=dict)
    status = Column(String(32), nullable=False, default="CONFIRMED")
    registered_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("event_id", "external_form_response_id", name="uq_registrations_external_form"),
        UniqueConstraint("event_id", "attendee_email", name="uq_registrations_event_email"),
        CheckConstraint("status IN ('PENDING', 'CONFIRMED', 'CANCELLED')", name="check_registration_status"),
        Index("ix_registrations_event_email", "event_id", "attendee_email"),
        Index("ix_registrations_status", "event_id", "status"),
    )

    event = relationship("Event", back_populates="registrations")
    ticket = relationship("Ticket", back_populates="registration", uselist=False)
