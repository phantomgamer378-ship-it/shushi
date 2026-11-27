import asyncio
import uuid
import hmac
import hashlib
import time
import json
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal
from app.core.security import hash_token, encrypt_payload, create_test_jwt
from app.domains.events.models import Event
from app.domains.staff.models import EventStaff
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.checkin.models import CheckIn
from app.domains.webhooks.models import WebhookReceipt


def compute_signature(secret: str, payload_bytes: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_concurrent_checkin_race_condition(client: AsyncClient):
    """
    PHASE 5 CONCURRENCY STRESS TEST:
    25 concurrent check-in requests targeting the EXACT SAME ticket simultaneously.
    Verifies that Postgres row-level locking (`with_for_update()`) and the `UNIQUE (ticket_id)`
    constraint on `check_ins` guarantee:
    1. Exactly ONE request succeeds with 200 OK ('ADMITTED').
    2. Exactly 24 requests are rejected with 409 Conflict ('ALREADY_CHECKED_IN').
    3. The database check_ins table contains STRICTLY 1 row for that ticket.
    """
    staff_user_id = uuid.uuid4()
    staff_token = create_test_jwt(user_id=staff_user_id, email="gate_staff@eventflow.io")
    headers = {"Authorization": f"Bearer {staff_token}"}

    event_id = uuid.uuid4()
    slug = f"stress-event-{uuid.uuid4().hex[:8]}"
    secret_payload = f"{uuid.uuid4().hex}{uuid.uuid4().hex}"
    raw_token = f"ef:v1:{secret_payload}"
    token_hash = hash_token(secret_payload)

    async with AsyncSessionLocal() as session:
        # 1. Create event
        event = Event(
            id=event_id,
            slug=slug,
            title="Concurrency Stress Summit",
            venue_name="Terminal 1",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            status="ACTIVE",
            webhook_secret_hash=encrypt_payload("secret-key"),
        )
        session.add(event)

        # 2. Add staff
        staff = EventStaff(event_id=event_id, user_id=staff_user_id, role="staff")
        session.add(staff)

        # 3. Create registration & ticket
        reg = Registration(
            event_id=event_id,
            external_form_response_id=f"STRESS-RESP-{uuid.uuid4().hex[:6]}",
            attendee_name="Concurrent Contender",
            attendee_email="contender@eventflow.io",
            status="CONFIRMED",
        )
        session.add(reg)
        await session.flush()

        ticket = Ticket(
            event_id=event_id,
            registration_id=reg.id,
            token_hash=token_hash,
            status="ACTIVE",
        )
        session.add(ticket)
        await session.commit()
        ticket_id = ticket.id

    # 4. Launch 25 concurrent check-in requests with unique idempotency keys
    CONCURRENCY_COUNT = 25

    async def attempt_checkin(worker_idx: int):
        return await client.post(
            f"/v1/events/{event_id}/check-in",
            headers=headers,
            json={
                "raw_token": raw_token,
                "gate_name": f"Gate Worker #{worker_idx}",
                "idempotency_key": str(uuid.uuid4()),
            },
        )

    tasks = [attempt_checkin(i) for i in range(CONCURRENCY_COUNT)]
    responses = await asyncio.gather(*tasks)

    # 5. Evaluate responses
    admitted_responses = [r for r in responses if r.status_code == 200]
    conflict_responses = [r for r in responses if r.status_code == 409]

    assert len(admitted_responses) == 1, (
        f"Expected strictly 1 ADMITTED response, got {len(admitted_responses)}. "
        f"Statuses: {[r.status_code for r in responses]}"
    )
    assert len(conflict_responses) == CONCURRENCY_COUNT - 1, (
        f"Expected {CONCURRENCY_COUNT - 1} 409 Conflict responses, got {len(conflict_responses)}."
    )

    admitted_data = admitted_responses[0].json()
    assert admitted_data["status"] == "ADMITTED"
    assert admitted_data["ticket_id"] == str(ticket_id)

    for cr in conflict_responses:
        problem = cr.json()
        assert problem["code"] == "ALREADY_CHECKED_IN"

    # 6. Verify database state
    async with AsyncSessionLocal() as session:
        count_res = await session.execute(
            select(func.count(CheckIn.id)).where(CheckIn.ticket_id == ticket_id)
        )
        row_count = count_res.scalar_one()
        assert row_count == 1, f"Expected exactly 1 check_in row in DB, found {row_count}!"


@pytest.mark.asyncio
async def test_concurrent_webhook_idempotency_race(client: AsyncClient):
    """
    PHASE 5 CONCURRENCY STRESS TEST:
    20 concurrent webhook requests with identical external_form_response_id.
    Verifies that UNIQUE(event_id, external_form_response_id) ensures only one registration is created.
    """
    event_id = uuid.uuid4()
    slug = f"webhook-race-{uuid.uuid4().hex[:8]}"
    secret = "super-secret-race-key"

    async with AsyncSessionLocal() as session:
        event = Event(
            id=event_id,
            slug=slug,
            title="Webhook Race Event",
            venue_name="Auditorium",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            status="ACTIVE",
            webhook_secret_hash=encrypt_payload(secret),
        )
        session.add(event)
        await session.commit()

    response_id = f"RACE-RESP-{uuid.uuid4().hex[:8]}"
    body_dict = {
        "response_id": response_id,
        "name": "Race Attendee",
        "email": f"race_{uuid.uuid4().hex[:6]}@eventflow.io",
    }
    raw_payload = json.dumps(body_dict).encode("utf-8")
    sig = compute_signature(secret, raw_payload)
    now_epoch = str(int(time.time()))
    headers = {
        "X-Webhook-Signature": sig,
        "X-Webhook-Timestamp": now_epoch,
        "Content-Type": "application/json",
    }

    CONCURRENT_WEBHOOKS = 20

    async def send_webhook():
        return await client.post(
            f"/v1/webhooks/google-forms/{event_id}",
            headers=headers,
            content=raw_payload,
        )

    tasks = [send_webhook() for _ in range(CONCURRENT_WEBHOOKS)]
    responses = await asyncio.gather(*tasks)

    # All responses should return 200 or 201 (idempotent replay)
    for r in responses:
        assert r.status_code in (200, 201), f"Unexpected status {r.status_code}: {r.text}"

    # Verify exactly 1 registration row exists
    async with AsyncSessionLocal() as session:
        reg_count = await session.execute(
            select(func.count(Registration.id)).where(
                Registration.event_id == event_id,
                Registration.external_form_response_id == response_id,
            )
        )
        assert reg_count.scalar_one() == 1
