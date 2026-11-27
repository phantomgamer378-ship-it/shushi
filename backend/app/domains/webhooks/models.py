import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class WebhookReceipt(Base):
    __tablename__ = "webhook_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    form_response_id = Column(String(128), nullable=False)
    payload_hash = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="PROCESSED")
    received_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "form_response_id", name="uq_webhook_receipts_event_form"),
        CheckConstraint("status IN ('PROCESSED', 'DUPLICATE', 'FAILED')", name="check_webhook_status"),
        Index("ix_webhook_receipts_lookup", "event_id", "form_response_id"),
    )
