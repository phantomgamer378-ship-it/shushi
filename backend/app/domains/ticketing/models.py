import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="RESTRICT"), nullable=False)
    registration_id = Column(UUID(as_uuid=True), ForeignKey("registrations.id", ondelete="RESTRICT"), nullable=False, unique=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    status = Column(String(32), nullable=False, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint("status IN ('ACTIVE', 'REVOKED')", name="check_ticket_status"),
        Index("ix_tickets_event_status", "event_id", "status"),
    )

    event = relationship("Event", back_populates="tickets")
    registration = relationship("Registration", back_populates="ticket")
    check_in = relationship("CheckIn", back_populates="ticket", uselist=False)
