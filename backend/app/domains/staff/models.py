import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class EventStaff(Base):
    __tablename__ = "event_staff"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_staff_user"),
        CheckConstraint("role IN ('owner', 'admin', 'staff', 'viewer')", name="check_staff_role"),
        Index("ix_event_staff_user_event", "user_id", "event_id"),
    )

    event = relationship("Event", back_populates="staff")
