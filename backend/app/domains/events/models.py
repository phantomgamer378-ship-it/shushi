import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Integer,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(128), nullable=False, unique=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    venue_name = Column(String(256), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(64), nullable=False, default="Asia/Kolkata")
    max_capacity = Column(Integer, nullable=True)
    status = Column(String(32), nullable=False, default="DRAFT")
    webhook_secret_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED')",
            name="check_event_status",
        ),
        Index("ix_events_status", "status"),
    )

    # Relationships
    staff = relationship("EventStaff", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="event")
    tickets = relationship("Ticket", back_populates="event")
    devices = relationship("ScannerDevice", back_populates="event", cascade="all, delete-orphan")
