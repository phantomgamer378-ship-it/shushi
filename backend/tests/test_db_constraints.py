import uuid
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.domains.events.models import Event
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.checkin.models import CheckIn
from app.core.security import hash_token


@pytest.mark.asyncio
async def test_database_unique_constraints(db_session):
    """
    Direct integration test on PostgreSQL to verify database constraints:
    - Unique registration external form ID per event
    - Authoritative single check-in per ticket (UNIQUE ticket_id in check_ins)
    """
    event = Event(
        slug=f"db-test-{uuid.uuid4().hex[:8]}",
        title="DB Constraint Test Event",
        venue_name="BKC",
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc) + timedelta(hours=4),
        timezone="Asia/Kolkata",
        webhook_secret_hash="fake_hash",
        status="ACTIVE",
    )
    db_session.add(event)
    await db_session.flush()

    # 1. Add first registration
    reg1 = Registration(
        event_id=event.id,
        external_form_response_id="form_resp_001",
        attendee_name="Pooja Patel",
        attendee_email="pooja@example.com",
        status="CONFIRMED",
    )
    db_session.add(reg1)
    await db_session.flush()

    # 2. Duplicate external_form_response_id must fail at DB constraint level
    reg2_dup = Registration(
        event_id=event.id,
        external_form_response_id="form_resp_001",
        attendee_name="Duplicate Attempt",
        attendee_email="other@example.com",
        status="CONFIRMED",
    )
    db_session.add(reg2_dup)
    with pytest.raises(IntegrityError):
        await db_session.flush()
    await db_session.rollback()

    # Re-insert event and reg1 for ticket check
    db_session.add(event)
    db_session.add(reg1)
    await db_session.flush()

    # 3. Create ticket
    token_hash = hash_token("test_token_raw_123")
    ticket = Ticket(
        event_id=event.id,
        registration_id=reg1.id,
        token_hash=token_hash,
        status="ACTIVE",
    )
    db_session.add(ticket)
    await db_session.flush()

    # 4. First check-in succeeds
    staff_id = uuid.uuid4()
    checkin1 = CheckIn(
        event_id=event.id,
        ticket_id=ticket.id,
        staff_id=staff_id,
        idempotency_key=str(uuid.uuid4()),
        gate_name="Gate 1",
    )
    db_session.add(checkin1)
    await db_session.flush()

    # 5. Second check-in on the SAME ticket must fail with UNIQUE constraint violation
    checkin2_dup = CheckIn(
        event_id=event.id,
        ticket_id=ticket.id,
        staff_id=staff_id,
        idempotency_key=str(uuid.uuid4()),
        gate_name="Gate 2",
    )
    db_session.add(checkin2_dup)
    with pytest.raises(IntegrityError):
        await db_session.flush()
    await db_session.rollback()
