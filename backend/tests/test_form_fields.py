import time
import json
import uuid
import hmac
import hashlib
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.events.models import Event


def compute_sig(secret: str, payload_bytes: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_form_fields_ingestion_and_rsvp(client, user_a_id, user_a_token):
    headers_a = {"Authorization": f"Bearer {user_a_token}"}
    
    # 1. Create and Activate Event
    start = datetime.now(timezone.utc) + timedelta(days=2)
    end = start + timedelta(hours=4)
    create_res = await client.post(
        "/v1/events",
        json={
            "slug": f"form-event-{uuid.uuid4().hex[:8]}",
            "title": "Freshers Event 2026",
            "venue_name": "Main Hall",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "timezone": "Asia/Kolkata",
            "max_capacity": 100,
        },
        headers=headers_a,
    )
    assert create_res.status_code == 201
    event_data = create_res.json()
    event_id = event_data["id"]
    webhook_secret = event_data["webhook_secret"]

    async with AsyncSessionLocal() as session:
        ev = await session.get(Event, uuid.UUID(event_id))
        ev.status = "ACTIVE"
        session.add(ev)
        await session.commit()

    # 2. Ingest Submission: Attending = "Yes" (Name, Email, Phone, URN, Attending)
    yes_payload = {
        "response_id": f"resp-yes-{uuid.uuid4().hex[:6]}",
        "name": "Divyanshu Kubde",
        "email": f"divyanshu.{uuid.uuid4().hex[:6]}@example.com",
        "phone": "+91 9876543210",
        "urn": "2201948",
        "attending": "Yes",
    }
    body_yes = json.dumps(yes_payload).encode("utf-8")
    now_ts = str(int(time.time()))
    sig_yes = compute_sig(webhook_secret, body_yes)

    resp_yes = await client.post(
        f"/v1/webhooks/google-forms/{event_id}",
        content=body_yes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig_yes,
            "X-Webhook-Timestamp": now_ts,
        },
    )
    assert resp_yes.status_code == 200
    data_yes = resp_yes.json()
    assert data_yes["action"] == "registered"

    # Verify Registration & Ticket in DB
    async with AsyncSessionLocal() as session:
        reg_res = await session.execute(
            select(Registration).where(Registration.id == uuid.UUID(data_yes["registration_id"]))
        )
        reg = reg_res.scalars().first()
        assert reg is not None
        assert reg.attendee_name == "Divyanshu Kubde"
        assert reg.urn == "2201948"
        assert reg.attendee_phone == "+91 9876543210"
        assert reg.status == "CONFIRMED"

        # Verify Ticket was issued
        t_res = await session.execute(select(Ticket).where(Ticket.registration_id == reg.id))
        ticket = t_res.scalars().first()
        assert ticket is not None
        assert ticket.status == "ACTIVE"

    # 3. Ingest Submission: Attending = "No" (Declined RSVP)
    no_payload = {
        "response_id": f"resp-no-{uuid.uuid4().hex[:6]}",
        "name": "Rohan Sharma",
        "email": f"rohan.{uuid.uuid4().hex[:6]}@example.com",
        "phone": "+91 9123456789",
        "urn": "2201955",
        "attending": "No",
    }
    body_no = json.dumps(no_payload).encode("utf-8")
    sig_no = compute_sig(webhook_secret, body_no)

    resp_no = await client.post(
        f"/v1/webhooks/google-forms/{event_id}",
        content=body_no,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig_no,
            "X-Webhook-Timestamp": now_ts,
        },
    )
    assert resp_no.status_code == 200
    data_no = resp_no.json()
    assert data_no["action"] == "declined"

    # Verify Registration was CANCELLED and NO Ticket was generated
    async with AsyncSessionLocal() as session:
        reg_no_res = await session.execute(
            select(Registration).where(Registration.id == uuid.UUID(data_no["registration_id"]))
        )
        reg_declined = reg_no_res.scalars().first()
        assert reg_declined.status == "CANCELLED"
        assert reg_declined.urn == "2201955"

        t_no_res = await session.execute(select(Ticket).where(Ticket.registration_id == reg_declined.id))
        ticket_declined = t_no_res.scalars().first()
        assert ticket_declined is None  # Zero tickets for declined RSVP

    # 4. Test Manual Registration API Endpoint
    manual_res = await client.post(
        f"/v1/events/{event_id}/registrations",
        json={
            "name": "Priya Patel",
            "email": f"priya.{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+91 9988776655",
            "urn": "2201999",
            "attending": "Yes",
        },
        headers=headers_a,
    )
    assert manual_res.status_code == 201
    manual_data = manual_res.json()
    assert manual_data["attendee_name"] == "Priya Patel"
    assert manual_data["urn"] == "2201999"
    assert manual_data["status"] == "CONFIRMED"

    # 5. Query registrations endpoint and verify all records include URN
    list_res = await client.get(f"/v1/events/{event_id}/registrations", headers=headers_a)
    assert list_res.status_code == 200
    records = list_res.json()
    assert len(records) == 3
    urns = {r["urn"] for r in records}
    assert "2201948" in urns
    assert "2201955" in urns
    assert "2201999" in urns
