import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ScannerDevice(Base):
    __tablename__ = "scanner_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    registered_by_user_id = Column(UUID(as_uuid=True), nullable=False)
    device_identifier = Column(String(128), nullable=False, unique=True)
    device_name = Column(String(128), nullable=False)
    gate_name = Column(String(128), nullable=False, default="Main Gate")
    is_active = Column(Boolean, nullable=False, default=True)
    last_heartbeat_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_scanner_devices_event", "event_id", "is_active"),
    )

    event = relationship("Event", back_populates="devices")
    check_ins = relationship("CheckIn", back_populates="device")


class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="RESTRICT"), nullable=False)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="RESTRICT"), nullable=False, unique=True)
    staff_id = Column(UUID(as_uuid=True), nullable=False)
    device_id = Column(UUID(as_uuid=True), ForeignKey("scanner_devices.id", ondelete="SET NULL"), nullable=True)
    gate_name = Column(String(128), nullable=False, default="Main Gate")
    idempotency_key = Column(String(128), nullable=False, unique=True)
    checked_in_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("ticket_id", name="uq_checkins_ticket_id"),
        UniqueConstraint("idempotency_key", name="uq_checkins_idempotency_key"),
        Index("ix_checkins_event_time", "event_id", "checked_in_at"),
        Index("ix_checkins_staff", "staff_id"),
    )

    ticket = relationship("Ticket", back_populates="check_in")
    device = relationship("ScannerDevice", back_populates="check_ins")
