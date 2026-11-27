from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.events.schemas import EventCreate, EventResponse, EventSummary
from app.domains.events.repository import EventRepository


class EventService:
    def __init__(self, db: AsyncSession):
        self.repo = EventRepository(db)

    async def create_event(self, event_in: EventCreate, creator_user_id: UUID) -> tuple[EventResponse, str]:
        existing = await self.repo.get_by_slug(event_in.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "SLUG_ALREADY_EXISTS", "message": f"Event with slug '{event_in.slug}' already exists."},
            )

        event, raw_secret = await self.repo.create_event(event_in, creator_user_id)
        resp = EventResponse.model_validate(event)
        resp.webhook_secret = raw_secret
        return resp, raw_secret

    async def get_event(self, event_id: UUID) -> EventResponse:
        event = await self.repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "EVENT_NOT_FOUND", "message": "Event does not exist."},
            )
        return EventResponse.model_validate(event)

    async def list_user_events(self, user_id: UUID) -> List[EventSummary]:
        records = await self.repo.list_for_user(user_id)
        summaries = []
        for event, role in records:
            summaries.append(
                EventSummary(
                    id=event.id,
                    slug=event.slug,
                    title=event.title,
                    venue_name=event.venue_name,
                    start_time=event.start_time,
                    end_time=event.end_time,
                    status=event.status,
                    user_role=role,
                )
            )
        return summaries
