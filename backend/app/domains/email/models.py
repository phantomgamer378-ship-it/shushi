import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Index, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class EmailOutbox(Base):
    __tablename__ = "email_outbox"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String(256), nullable=False)
    subject = Column(String(256), nullable=False)
    encrypted_token_payload = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="PENDING")
    attempts = Column(Integer, nullable=False, default=0)
    next_retry_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'PROCESSING', 'SENT', 'RETRY', 'DEAD_LETTER')", name="check_outbox_status"),
        Index("ix_email_outbox_queue", "status", "next_retry_at"),
    )
