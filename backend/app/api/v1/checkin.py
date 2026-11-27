from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db_session
from app.core.rbac import require_event_role, EventRole, EventStaffContext
from app.core.security import hash_token
from app.domains.ticketing.models import Ticket
from app.domains.checkin.models import CheckIn
from app.domains.registrations.models import Registration

router = APIRouter(prefix="/events/{event_id}", tags=["Check-in"])


class CheckInRequest(BaseModel):
    raw_token: str = Field(..., min_length=10, max_length=256, description="Raw token scanned from QR code")
    device_id: Optional[UUID] = None
    gate_name: str = Field(default="Main Gate", max_length=128)
    idempotency_key: str = Field(..., min_length=1, max_length=128)


@router.post("/check-in")
async def process_gate_check_in(
    event_id: UUID,
    body: CheckInRequest,
    context: EventStaffContext = Depends(require_event_role(EventRole.STAFF)),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Atomic ticket check-in at event gate.
    Locks ticket row with FOR UPDATE, verifies active status, and records single check-in.
    """
    # 1. Parse token (strip 'ef:v1:' prefix if present)
    clean_token = body.raw_token.strip()
    if clean_token.startswith("ef:"):
        parts = clean_token.split(":")
        clean_token = parts[-1]

    token_digest = hash_token(clean_token)

    # 2. Check Idempotency for network retries
    idemp_query = select(CheckIn).where(
        CheckIn.event_id == event_id,
        CheckIn.idempotency_key == body.idempotency_key,
    )
    idemp_res = await db.execute(idemp_query)
    existing_checkin = idemp_res.scalars().first()
    if existing_checkin:
        return {
            "status": "ADMITTED",
            "message": "Check-in verified (idempotent replay).",
            "ticket_id": str(existing_checkin.ticket_id),
            "checked_in_at": existing_checkin.checked_in_at.isoformat(),
        }

    # 3. Lock Ticket Row with FOR UPDATE
    ticket_query = (
        select(Ticket)
        .where(Ticket.event_id == event_id, Ticket.token_hash == token_digest)
        .with_for_update()
    )
    ticket_res = await db.execute(ticket_query)
    ticket = ticket_res.scalars().first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INVALID_TICKET", "message": "Ticket not found or does not belong to this event."},
        )

    if ticket.status == "REVOKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TICKET_REVOKED", "message": "This ticket has been revoked."},
        )

    # 4. Check if already checked in (Authoritative check_ins lookup)
    consumed_query = select(CheckIn).where(CheckIn.ticket_id == ticket.id)
    consumed_res = await db.execute(consumed_query)
    prior_checkin = consumed_res.scalars().first()

    if prior_checkin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "ALREADY_CHECKED_IN",
                "message": f"Ticket already consumed at {prior_checkin.checked_in_at.isoformat()} at {prior_checkin.gate_name}.",
                "checked_in_at": prior_checkin.checked_in_at.isoformat(),
                "gate_name": prior_checkin.gate_name,
            },
        )

    # 5. Insert Check-In Record
    checkin_record = CheckIn(
        event_id=event_id,
        ticket_id=ticket.id,
        staff_id=context.user.id,
        device_id=body.device_id,
        gate_name=body.gate_name,
        idempotency_key=body.idempotency_key,
    )
    db.add(checkin_record)

    # Fetch attendee name for gate staff display
    reg_res = await db.execute(select(Registration).where(Registration.id == ticket.registration_id))
    registration = reg_res.scalars().first()
    attendee_name = registration.attendee_name if registration else "Attendee"

    await db.commit()

    return {
        "status": "ADMITTED",
        "ticket_id": str(ticket.id),
        "attendee_name": attendee_name,
        "gate_name": body.gate_name,
        "checked_in_at": checkin_record.checked_in_at.isoformat(),
        "message": f"Welcome, {attendee_name}!",
    }


class CheckInItemResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    attendee_name: str
    gate_name: str
    checked_in_at: str
    staff_id: Optional[UUID] = None


@router.get("/check-ins", response_model=list[CheckInItemResponse])
async def list_event_checkins(
    event_id: UUID,
    limit: int = 50,
    context: EventStaffContext = Depends(require_event_role(EventRole.VIEWER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists recent gate check-ins with attendee details for live dashboards."""
    stmt = (
        select(CheckIn, Registration.attendee_name)
        .join(Ticket, CheckIn.ticket_id == Ticket.id)
        .join(Registration, Ticket.registration_id == Registration.id)
        .where(CheckIn.event_id == event_id)
        .order_by(CheckIn.checked_in_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = result.all()

    return [
        CheckInItemResponse(
            id=checkin.id,
            ticket_id=checkin.ticket_id,
            attendee_name=attendee_name or "Attendee",
            gate_name=checkin.gate_name,
            checked_in_at=checkin.checked_in_at.isoformat(),
            staff_id=checkin.staff_id,
        )
        for checkin, attendee_name in records
    ]

