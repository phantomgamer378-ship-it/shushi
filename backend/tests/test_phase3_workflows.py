import time
import json
import uuid
import hmac
import hashlib
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.domains.email.models import EmailOutbox
from app.domains.ticketing.models import Ticket
from app.domains.registrations.models import Registration
from app.domains.email.service import EmailOutboxService
from app.domains.email.resend_adapter import ResendEmailAdapter
from app.core.security import decrypt_payload


def compute_webhook_sig(secret: str, payload_bytes: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_complete_phase3_workflow(client, user_a_id, user_a_token, user_b_id, user_b_token):
    # 1. Create Event by User A (Event Owner)
    unique_slug = f"rsvp-summit-{uuid.uuid4().hex[:8]}"
    start = datetime.now(timezone.utc) + timedelta(days=5)
    end = start + timedelta(hours=6)

    event_payload = {
        "slug": unique_slug,
        "title": "RSVP Test Summit",
        "venue_name": "BKC Auditorium",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "timezone": "Asia/Kolkata",
        "max_capacity": 50,
    }

    headers_a = {"Authorization": f"Bearer {user_a_token}"}
    create_res = await client.post("/v1/events", json=event_payload, headers=headers_a)
    assert create_res.status_code == 201
    event_data = create_res.json()
    event_id = event_data["id"]
    webhook_secret = event_data["webhook_secret"]
    assert webhook_secret is not None

    # Activate event so it accepts registrations
    async with AsyncSessionLocal() as session:
        from app.domains.events.models import Event
        ev = await session.get(Event, uuid.UUID(event_id))
        ev.status = "ACTIVE"
        session.add(ev)
        await session.commit()

    # 2. Test Invalid Webhook Signature -> 400
    test_email = f"kavita.{uuid.uuid4().hex[:6]}@example.com"
    form_resp_id = f"form_resp_{uuid.uuid4().hex[:8]}"
    body = {
        "response_id": form_resp_id,
        "name": "Kavita Rao",
        "email": test_email,
        "phone": "+919876500001",
    }
    body_bytes = json.dumps(body).encode("utf-8")
    now_epoch = str(int(time.time()))

    bad_sig_headers = {
        "X-Webhook-Signature": "wrong_signature_12345",
        "X-Webhook-Timestamp": now_epoch,
        "Content-Type": "application/json",
    }
    res_bad_sig = await client.post(f"/v1/webhooks/google-forms/{event_id}", content=body_bytes, headers=bad_sig_headers)
    assert res_bad_sig.status_code == 400
    assert res_bad_sig.json()["code"] == "INVALID_SIGNATURE"

    # 3. Test Expired Webhook Timestamp -> 400
    expired_epoch = str(int(time.time()) - 400)  # > 300s drift
    valid_sig = compute_webhook_sig(webhook_secret, body_bytes)
    expired_headers = {
        "X-Webhook-Signature": valid_sig,
        "X-Webhook-Timestamp": expired_epoch,
        "Content-Type": "application/json",
    }
    res_expired = await client.post(f"/v1/webhooks/google-forms/{event_id}", content=body_bytes, headers=expired_headers)
    assert res_expired.status_code == 400
    assert res_expired.json()["code"] == "CLOCK_DRIFT_EXCEEDED"

    # 4. Valid Webhook Submission -> 200 OK (registered)
    valid_headers = {
        "X-Webhook-Signature": valid_sig,
        "X-Webhook-Timestamp": now_epoch,
        "Content-Type": "application/json",
    }
    res_valid = await client.post(f"/v1/webhooks/google-forms/{event_id}", content=body_bytes, headers=valid_headers)
    assert res_valid.status_code == 200
    val_data = res_valid.json()
    assert val_data["status"] == "success"
    assert val_data["action"] == "registered"
    registration_id = val_data["registration_id"]

    # 5. Idempotent Duplicate Webhook -> 200 OK (already_processed)
    res_duplicate = await client.post(f"/v1/webhooks/google-forms/{event_id}", content=body_bytes, headers=valid_headers)
    assert res_duplicate.status_code == 200
    dup_data = res_duplicate.json()
    assert dup_data["action"] == "already_processed"
    assert dup_data["registration_id"] == registration_id

    # 6. Duplicate Attendee Email with distinct form response ID -> 409 Conflict
    body_diff_id = {
        "response_id": f"form_resp_diff_{uuid.uuid4().hex[:8]}",
        "name": "Kavita Rao Imposter",
        "email": test_email,  # Duplicate email!
        "phone": "+919876500001",
    }
    body_diff_bytes = json.dumps(body_diff_id).encode("utf-8")
    sig_diff = compute_webhook_sig(webhook_secret, body_diff_bytes)
    headers_diff = {
        "X-Webhook-Signature": sig_diff,
        "X-Webhook-Timestamp": now_epoch,
        "Content-Type": "application/json",
    }
    res_dup_email = await client.post(f"/v1/webhooks/google-forms/{event_id}", content=body_diff_bytes, headers=headers_diff)
    assert res_dup_email.status_code == 409
    assert res_dup_email.json()["code"] == "DUPLICATE_REGISTRATION"

    # 7. Non-existent Event ID -> 404
    fake_event_id = uuid.uuid4()
    res_fake = await client.post(f"/v1/webhooks/google-forms/{fake_event_id}", content=body_bytes, headers=valid_headers)
    assert res_fake.status_code == 404

    # 8. Outbox Worker: Process pending email queue & wipe token payload
    async with AsyncSessionLocal() as db_session:
        outbox_query = select(EmailOutbox).where(EmailOutbox.recipient_email == test_email)
        outbox_res = await db_session.execute(outbox_query)
        outbox_item = outbox_res.scalars().first()
        assert outbox_item is not None
        assert outbox_item.status == "PENDING"
        assert outbox_item.encrypted_token_payload is not None

        # Decrypt raw token before worker wipes it
        raw_token_for_scan = decrypt_payload(outbox_item.encrypted_token_payload)

        # Process outbox
        worker_service = EmailOutboxService(db_session, ResendEmailAdapter())
        processed_count = await worker_service.process_pending_batch()
        assert processed_count >= 1

        # Verify outbox item is now SENT and encrypted_token_payload is WIPED (NULL)
        await db_session.refresh(outbox_item)
        assert outbox_item.status == "SENT"
        assert outbox_item.encrypted_token_payload is None
        assert outbox_item.sent_at is not None

    # 9. Admin lists registrations & tickets
    res_regs = await client.get(f"/v1/events/{event_id}/registrations", headers=headers_a)
    assert res_regs.status_code == 200
    assert len(res_regs.json()) == 1
    assert res_regs.json()[0]["attendee_email"] == test_email

    res_tickets = await client.get(f"/v1/events/{event_id}/tickets", headers=headers_a)
    assert res_tickets.status_code == 200
    assert len(res_tickets.json()) == 1
    ticket_id = res_tickets.json()[0]["id"]
    assert res_tickets.json()[0]["status"] == "ACTIVE"

    # 10. Check-in Gate Scanning:
    scan_payload = {
        "raw_token": f"ef:v1:{raw_token_for_scan}",
        "gate_name": "Gate 1 - Main Entrance",
        "idempotency_key": str(uuid.uuid4()),
    }
    # User A (Owner/Staff) scans QR code
    res_scan1 = await client.post(f"/v1/events/{event_id}/check-in", json=scan_payload, headers=headers_a)
    assert res_scan1.status_code == 200
    scan_data = res_scan1.json()
    assert scan_data["status"] == "ADMITTED"
    assert scan_data["attendee_name"] == "Kavita Rao"

    # Second scan with duplicate idempotency key -> 200 idempotent replay
    res_scan_replay = await client.post(f"/v1/events/{event_id}/check-in", json=scan_payload, headers=headers_a)
    assert res_scan_replay.status_code == 200
    assert res_scan_replay.json()["status"] == "ADMITTED"

    # Second scan with NEW idempotency key on already admitted ticket -> 409 ALREADY_CHECKED_IN
    scan_payload_dup = {
        "raw_token": f"ef:v1:{raw_token_for_scan}",
        "gate_name": "Gate 2 - VIP Gate",
        "idempotency_key": str(uuid.uuid4()),
    }
    res_scan_double = await client.post(f"/v1/events/{event_id}/check-in", json=scan_payload_dup, headers=headers_a)
    assert res_scan_double.status_code == 409
    assert res_scan_double.json()["code"] == "ALREADY_CHECKED_IN"

    # 11. Revoke Ticket
    res_revoke = await client.post(f"/v1/events/{event_id}/tickets/{ticket_id}/revoke", headers=headers_a)
    assert res_revoke.status_code == 200
    assert res_revoke.json()["status"] == "success"

    # Revoked ticket cannot be checked in
    scan_revoked_payload = {
        "raw_token": f"ef:v1:{raw_token_for_scan}",
        "gate_name": "Gate 1",
        "idempotency_key": str(uuid.uuid4()),
    }
    res_scan_revoked = await client.post(f"/v1/events/{event_id}/check-in", json=scan_revoked_payload, headers=headers_a)
    # The check-in endpoint detects revoked ticket and returns 400 TICKET_REVOKED
    assert res_scan_revoked.status_code == 400
    assert res_scan_revoked.json()["code"] == "TICKET_REVOKED"
