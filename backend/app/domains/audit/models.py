import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    actor_user_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String(64), nullable=False)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    payload_diff = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(256), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_audit_logs_event_created", "event_id", "created_at"),
        Index("ix_audit_logs_actor", "actor_user_id"),
    )
