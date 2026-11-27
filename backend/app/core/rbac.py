from enum import Enum
from typing import Callable
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from fastapi import Depends, HTTPException, status, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import AuthUser, get_current_user
from app.core.database import get_db_session
from app.domains.staff.models import EventStaff


class EventRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    STAFF = "staff"
    VIEWER = "viewer"


ROLE_HIERARCHY = {
    EventRole.VIEWER: 1,
    EventRole.STAFF: 2,
    EventRole.ADMIN: 3,
    EventRole.OWNER: 4,
}


class EventStaffContext(BaseModel):
    user: AuthUser
    event_id: UUID
    role: EventRole

    model_config = ConfigDict(arbitrary_types_allowed=True)


def require_event_role(minimum_role: EventRole) -> Callable:
    """
    FastAPI Dependency Factory that enforces event-scoped RBAC and IDOR prevention.
    Verifies that the authenticated user has at least the minimum role for the target event.
    """
    async def dependency(
        event_id: UUID = Path(..., description="Target Event UUID"),
        current_user: AuthUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db_session),
    ) -> EventStaffContext:
        # Query event_staff table for active membership
        query = select(EventStaff).where(
            EventStaff.event_id == event_id,
            EventStaff.user_id == current_user.id,
        )
        result = await db.execute(query)
        staff_record = result.scalars().first()

        if not staff_record:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ACCESS_DENIED_EVENT",
                    "message": "User is not authorized for this event.",
                },
            )

        try:
            assigned_role = EventRole(staff_record.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "INVALID_ASSIGNED_ROLE", "message": "Unknown staff role in record."},
            )

        if ROLE_HIERARCHY[assigned_role] < ROLE_HIERARCHY[minimum_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INSUFFICIENT_EVENT_PRIVILEGES",
                    "message": f"Operation requires minimum role '{minimum_role.value}', but user has '{assigned_role.value}'.",
                },
            )

        return EventStaffContext(
            user=current_user,
            event_id=event_id,
            role=assigned_role,
        )

    return dependency
