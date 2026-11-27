from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.core.security import AuthUser, get_current_user
from app.core.rbac import require_event_role, EventRole, EventStaffContext
from app.domains.events.schemas import EventCreate, EventResponse, EventSummary
from app.domains.events.service import EventService

router = APIRouter(prefix="/events", tags=["Events"])


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
