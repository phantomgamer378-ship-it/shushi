from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db_session
from app.core.security import AuthUser, get_current_user
from app.core.rbac import require_event_role, EventRole, EventStaffContext
from app.domains.events.schemas import EventCreate, EventResponse, EventSummary
from app.domains.events.service import EventService
from app.domains.staff.models import EventStaff
from app.domains.registrations.models import Registration
from app.domains.checkin.models import CheckIn
from app.domains.ticketing.models import Ticket

router = APIRouter(prefix="/events", tags=["Events"])


class EventStatsResponse(BaseModel):
    event_id: UUID
    total_registrations: int
    total_admitted: int
    pending_admission: int
    max_capacity: Optional[int] = None
    admission_rate_percent: float


class StaffMemberResponse(BaseModel):
    id: UUID
    event_id: UUID
    user_id: UUID
    role: str
    created_at: str


class StaffMemberCreate(BaseModel):
    user_id: UUID
    role: str = Field(..., pattern="^(owner|admin|staff|viewer)$")


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Creates a new event and designates the authenticated caller as Event Owner."""
    service = EventService(db)
    event_response, _ = await service.create_event(event_in, current_user.id)
    await db.commit()
    return event_response


@router.get("", response_model=List[EventSummary])
async def list_events(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists events that the authenticated user is authorized to manage or view."""
    service = EventService(db)
    return await service.list_user_events(current_user.id)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event_details(
    event_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.VIEWER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieves detailed event configuration. Enforces minimum VIEWER role on target event."""
    service = EventService(db)
    return await service.get_event(event_id)


@router.get("/{event_id}/stats", response_model=EventStatsResponse)
async def get_event_stats(
    event_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.VIEWER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Calculates live registration, admission, and capacity statistics."""
    service = EventService(db)
    event = await service.get_event(event_id)

    # Count registrations
    reg_count_res = await db.execute(
        select(func.count(Registration.id)).where(Registration.event_id == event_id)
    )
    total_reg = reg_count_res.scalar_one_or_none() or 0

    # Count check-ins
    checkin_count_res = await db.execute(
        select(func.count(CheckIn.id)).where(CheckIn.event_id == event_id)
    )
    total_admitted = checkin_count_res.scalar_one_or_none() or 0

    pending = max(0, total_reg - total_admitted)
    rate = round((total_admitted / total_reg * 100), 1) if total_reg > 0 else 0.0

    return EventStatsResponse(
        event_id=event_id,
        total_registrations=total_reg,
        total_admitted=total_admitted,
        pending_admission=pending,
        max_capacity=event.max_capacity,
        admission_rate_percent=rate,
    )


@router.get("/{event_id}/staff", response_model=List[StaffMemberResponse])
async def list_event_staff(
    event_id: UUID,
    context: EventStaffContext = Depends(require_event_role(EventRole.ADMIN)),
    db: AsyncSession = Depends(get_db_session),
):
    """Lists all staff members assigned to an event."""
    res = await db.execute(select(EventStaff).where(EventStaff.event_id == event_id).order_by(EventStaff.created_at.asc()))
    staff_list = res.scalars().all()
    return [
        StaffMemberResponse(
            id=s.id,
            event_id=s.event_id,
            user_id=s.user_id,
            role=s.role,
            created_at=s.created_at.isoformat(),
        )
        for s in staff_list
    ]


@router.post("/{event_id}/staff", response_model=StaffMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_or_update_staff(
    event_id: UUID,
    body: StaffMemberCreate,
    context: EventStaffContext = Depends(require_event_role(EventRole.OWNER)),
    db: AsyncSession = Depends(get_db_session),
):
    """Assigns or updates a staff member's role (Owner only)."""
    res = await db.execute(
        select(EventStaff).where(EventStaff.event_id == event_id, EventStaff.user_id == body.user_id)
    )
    existing = res.scalars().first()
    if existing:
        existing.role = body.role
        db.add(existing)
        target = existing
    else:
        target = EventStaff(event_id=event_id, user_id=body.user_id, role=body.role)
        db.add(target)

    await db.commit()
    await db.refresh(target)
    return StaffMemberResponse(
        id=target.id,
        event_id=target.event_id,
        user_id=target.user_id,
        role=target.role,
        created_at=target.created_at.isoformat(),
    )

