from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db_session
from app.core.rbac import require_event_role, EventRole, EventStaffContext
from app.core.security import hash_token, encrypt_payload
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.email.models import EmailOutbox
from app.domains.events.models import Event
from app.domains.audit.models import AuditLog
from app.domains.registrations.schemas import RegistrationResponse, TicketResponse

router = APIRouter(prefix="/events/{event_id}", tags=["Registrations & Ticketing"])


@router.get("/registrations", response_model=List[RegistrationResponse])
async def list_event_registrations(
    event_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.VIEWER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists attendee registrations for the specified event."""
    query = select(Registration).where(Registration.event_id == event_id).order_by(Registration.registered_at.desc())
    res = await db.execute(query)
    return [RegistrationResponse.model_validate(r) for r in res.scalars().all()]


@router.get("/tickets", response_model=List[TicketResponse])
async def list_event_tickets(
    event_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.VIEWER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists ticket records (containing SHA-256 token hashes, zero raw secrets) for the event."""
    query = select(Ticket).where(Ticket.event_id == event_id).order_by(Ticket.created_at.desc())
    res = await db.execute(query)
    return [TicketResponse.model_validate(t) for r in res.scalars().all() if (t := r)]


@router.post("/tickets/{ticket_id}/revoke")
async def revoke_ticket(
    event_id: UUID,
    ticket_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.ADMIN)),
    db: AsyncSession = Depends(get_db_session),
):
    """Revokes an active ticket. Prevents any future check-in admission."""
    query = select(Ticket).where(Ticket.id == ticket_id, Ticket.event_id == event_id)
    res = await db.execute(query)
    ticket = res.scalars().first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TICKET_NOT_FOUND", "message": "Ticket does not exist for this event."},
        )

    if ticket.status == "REVOKED":
        return {"status": "success", "ticket_id": str(ticket.id), "message": "Ticket is already revoked."}

    ticket.status = "REVOKED"
    db.add(ticket)

    audit = AuditLog(
        event_id=event_id,
        actor_user_id=context.user.id,
        action="TICKET_REVOKED",
        entity_type="ticket",
        entity_id=ticket.id,
    )
    db.add(audit)
    await db.commit()

    return {"status": "success", "ticket_id": str(ticket.id), "message": "Ticket successfully revoked."}


@router.post("/tickets/{ticket_id}/resend")
async def resend_or_reissue_ticket(
    event_id: UUID,
    ticket_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.ADMIN)),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Re-issues an active ticket: generates a new cryptographically secure token,
    replaces token_hash, and re-enqueues ticket email in the outbox.
    """
    query = select(Ticket).where(Ticket.id == ticket_id, Ticket.event_id == event_id)
    res = await db.execute(query)
    ticket = res.scalars().first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TICKET_NOT_FOUND", "message": "Ticket does not exist for this event."},
        )

    if ticket.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_RESEND_REVOKED", "message": "Cannot resend email for a revoked ticket."},
        )

    # Fetch associated event and registration
    event_res = await db.execute(select(Event).where(Event.id == event_id))
    event = event_res.scalars().first()

    reg_res = await db.execute(select(Registration).where(Registration.id == ticket.registration_id))
    registration = reg_res.scalars().first()

    # Generate fresh raw token
    new_raw_token = secrets.token_urlsafe(32)
    ticket.token_hash = hash_token(new_raw_token)
    db.add(ticket)

    # Re-enqueue in email outbox
    encrypted_token = encrypt_payload(new_raw_token)
    outbox_item = EmailOutbox(
        event_id=event_id,
        ticket_id=ticket.id,
        recipient_email=registration.attendee_email,
        subject=f"Your Admission Ticket (Reissued) — {event.title}",
        encrypted_token_payload=encrypted_token,
        status="PENDING",
        attempts=0,
    )
    db.add(outbox_item)

    audit = AuditLog(
        event_id=event_id,
        actor_user_id=context.user.id,
        action="TICKET_REISSUED",
        entity_type="ticket",
        entity_id=ticket.id,
    )
    db.add(audit)
    await db.commit()

    return {"status": "success", "ticket_id": str(ticket.id), "message": "Ticket reissued and email queued."}
