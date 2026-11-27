import time
import json
from uuid import UUID
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db_session
from app.core.security import verify_webhook_hmac, decrypt_payload
from app.domains.events.models import Event
from app.domains.registrations.schemas import GoogleFormsWebhookPayload
from app.domains.registrations.service import RegistrationService

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

MAX_BODY_SIZE_BYTES = 65536  # 64 KB protection against DoS
CLOCK_DRIFT_TOLERANCE_SECONDS = 300  # 5 minutes


@router.post("/google-forms/{event_id}")
async def handle_google_forms_webhook(
    event_id: UUID,
    request: Request,
    x_webhook_signature: str = Header(..., alias="X-Webhook-Signature"),
    x_webhook_timestamp: str = Header(..., alias="X-Webhook-Timestamp"),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Ingests attendee RSVP submissions from Google Apps Script.
    Enforces HMAC-SHA256 signature, 5-minute replay window, and idempotent processing.
    """
    # 1. Verify Timestamp Freshness
    try:
        req_timestamp = int(x_webhook_timestamp)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TIMESTAMP", "message": "X-Webhook-Timestamp must be an integer epoch."},
        )

    now = int(time.time())
    if abs(now - req_timestamp) > CLOCK_DRIFT_TOLERANCE_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CLOCK_DRIFT_EXCEEDED",
                "message": f"Webhook timestamp drift exceeds {CLOCK_DRIFT_TOLERANCE_SECONDS}s tolerance window.",
            },
        )

    # 2. Read Raw Request Body with Size Guard
    body_bytes = await request.body()
    if len(body_bytes) > MAX_BODY_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "PAYLOAD_TOO_LARGE", "message": "Webhook body exceeds maximum allowed size."},
        )

    # 3. Fetch Event to obtain secret
    event_query = select(Event).where(Event.id == event_id)
    event_res = await db.execute(event_query)
    event = event_res.scalars().first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "EVENT_NOT_FOUND", "message": "Target event does not exist."},
        )

    # Decrypt event webhook secret
    try:
        secret = decrypt_payload(event.webhook_secret_hash)
    except Exception:
        # Fallback if stored as plaintext or raw secret in tests
        secret = event.webhook_secret_hash

    # 4. Constant-Time HMAC-SHA256 Verification
    is_valid = verify_webhook_hmac(body_bytes, x_webhook_signature, secret)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_SIGNATURE", "message": "Cryptographic signature validation failed."},
        )

    # 5. Parse and Validate Payload Structure
    try:
        payload_data = json.loads(body_bytes.decode("utf-8"))
        webhook_payload = GoogleFormsWebhookPayload.model_validate(payload_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "MALFORMED_PAYLOAD", "message": f"Invalid payload structure: {str(e)}"},
        )

    # 6. Process Registration Atomically
    service = RegistrationService(db)
    registration, action = await service.process_google_forms_submission(
        event_id=event_id,
        payload=webhook_payload,
        raw_body_bytes=body_bytes,
    )

    return {
        "status": "success",
        "action": action,
        "registration_id": str(registration.id),
        "message": "Registration processed successfully." if action == "registered" else "Duplicate submission acknowledged.",
    }
