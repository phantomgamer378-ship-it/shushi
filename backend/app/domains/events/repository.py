import secrets
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.events.models import Event
from app.domains.staff.models import EventStaff
from app.domains.events.schemas import EventCreate
from app.core.security import hash_webhook_secret


class EventRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, event_id: UUID) -> Optional[Event]:
        query = select(Event).where(Event.id == event_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Event]:
        query = select(Event).where(Event.slug == slug)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_for_user(self, user_id: UUID) -> List[tuple[Event, str]]:
        query = (
            select(Event, EventStaff.role)
            .join(EventStaff, Event.id == EventStaff.event_id)
            .where(EventStaff.user_id == user_id)
            .order_by(Event.start_time.desc())
        )
        result = await self.db.execute(query)
        return list(result.all())

    async def create_event(
        self,
        event_in: EventCreate,
        creator_user_id: UUID,
    ) -> tuple[Event, str]:
        # Generate initial raw webhook secret for the event
        raw_secret = secrets.token_hex(24)
        secret_hash = hash_webhook_secret(raw_secret)

        event = Event(
            slug=event_in.slug,
            title=event_in.title,
            description=event_in.description,
            venue_name=event_in.venue_name,
            start_time=event_in.start_time,
            end_time=event_in.end_time,
            timezone=event_in.timezone,
            max_capacity=event_in.max_capacity,
            status="DRAFT",
            webhook_secret_hash=secret_hash,
        )
        self.db.add(event)
        await self.db.flush()

        # Automatically assign creator as OWNER
        staff = EventStaff(
            event_id=event.id,
            user_id=creator_user_id,
            role="owner",
        )
        self.db.add(staff)
        await self.db.flush()

        return event, raw_secret
