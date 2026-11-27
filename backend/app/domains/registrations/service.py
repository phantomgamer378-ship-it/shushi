import secrets
import hashlib
from typing import Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domains.events.models import Event
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.email.models import EmailOutbox
from app.domains.webhooks.models import WebhookReceipt
from app.domains.audit.models import AuditLog
from app.domains.registrations.schemas import (
    GoogleFormsWebhookPayload,
    ManualRegistrationCreate,
    RegistrationResponse,
)
from app.core.security import hash_token, encrypt_payload


class RegistrationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_google_forms_submission(
        self,
        event_id: UUID,
        payload: GoogleFormsWebhookPayload,
        raw_body_bytes: bytes,
    ) -> Tuple[RegistrationResponse, str]:
        """
        Processes inbound Google Form RSVP submission atomically:
        - Validates event state & capacity
        - Checks idempotency (response_id)
        - Enforces single active registration per email
        - Generates 256-bit random ticket token
        - Enqueues encrypted token into transactional email_outbox
        - Commits all mutations in a single ACID transaction
        """
        # 1. Fetch and validate event
        event_query = select(Event).where(Event.id == event_id).with_for_update()
        event_res = await self.db.execute(event_query)
        event = event_res.scalars().first()

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "EVENT_NOT_FOUND", "message": "Event does not exist."},
            )

        if event.status not in ("PUBLISHED", "ACTIVE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "EVENT_REGISTRATION_CLOSED", "message": f"Event status is {event.status}. Registrations closed."},
            )

        # 2. Check Capacity limit if configured
        if event.max_capacity is not None:
            count_query = select(func.count(Registration.id)).where(
                Registration.event_id == event_id,
                Registration.status != "CANCELLED",
            )
            count_res = await self.db.execute(count_query)
            current_count = count_res.scalar() or 0
            if current_count >= event.max_capacity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"code": "CAPACITY_REACHED", "message": "Event has reached maximum capacity."},
                )

        # 3. Check Webhook Receipt Idempotency (stable response_id)
        receipt_query = select(WebhookReceipt).where(
            WebhookReceipt.event_id == event_id,
            WebhookReceipt.form_response_id == payload.response_id,
        )
        receipt_res = await self.db.execute(receipt_query)
        existing_receipt = receipt_res.scalars().first()

        if existing_receipt:
            # Idempotent replay: Fetch existing registration and return
            reg_query = select(Registration).where(
                Registration.event_id == event_id,
                Registration.external_form_response_id == payload.response_id,
            )
            reg_res = await self.db.execute(reg_query)
            existing_reg = reg_res.scalars().first()
            if existing_reg:
                return RegistrationResponse.model_validate(existing_reg), "already_processed"

        # 4. Check Duplicate Attendee Email Policy
        normalized_email = payload.email.strip().lower()
        email_query = select(Registration).where(
            Registration.event_id == event_id,
            Registration.attendee_email == normalized_email,
            Registration.status != "CANCELLED",
        )
        email_res = await self.db.execute(email_query)
        duplicate_email = email_res.scalars().first()

        if duplicate_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_REGISTRATION",
                    "message": f"An active registration already exists for email {normalized_email}.",
                },
            )

        # 5. Record Webhook Receipt
        body_hash = hashlib.sha256(raw_body_bytes).hexdigest()
        receipt = WebhookReceipt(
            event_id=event_id,
            form_response_id=payload.response_id,
            payload_hash=body_hash,
            status="PROCESSED",
        )
        self.db.add(receipt)

        # Determine attending status from payload
        attending_answer = (payload.attending or "").strip().lower()
        if not attending_answer and payload.custom_fields:
            attending_answer = str(
                payload.custom_fields.get("attending")
                or payload.custom_fields.get("are_you_attending")
                or ""
            ).strip().lower()

        is_attending = attending_answer not in ("no", "not attending", "false", "0")
        reg_status = "CONFIRMED" if is_attending else "CANCELLED"

        # Resolve URN from direct field or custom_fields
        urn_val = (payload.urn or "").strip() or None
        if not urn_val and payload.custom_fields:
            urn_val = str(payload.custom_fields.get("urn") or payload.custom_fields.get("URN") or "").strip() or None

        meta_dict = dict(payload.custom_fields or {})
        if urn_val:
            meta_dict["urn"] = urn_val
        meta_dict["attending"] = "Yes" if is_attending else "No"

        # 6. Create Registration Record
        registration = Registration(
            event_id=event_id,
            external_form_response_id=payload.response_id,
            attendee_name=payload.name.strip(),
            attendee_email=normalized_email,
            attendee_phone=payload.phone.strip() if payload.phone else None,
            urn=urn_val,
            metadata_json=meta_dict,
            status=reg_status,
        )
        self.db.add(registration)
        await self.db.flush()

        # If attendee declined ("No"), do NOT issue a ticket pass
        if not is_attending:
            audit = AuditLog(
                event_id=event_id,
                action="REGISTRATION_DECLINED",
                entity_type="registration",
                entity_id=registration.id,
                payload_diff={
                    "form_response_id": payload.response_id,
                    "email": normalized_email,
                    "attending": "No",
                },
            )
            self.db.add(audit)
            await self.db.commit()
            return RegistrationResponse.model_validate(registration), "declined"

        # 7. Generate Cryptographically Secure 256-bit Random Token
        raw_token = secrets.token_urlsafe(32)
        token_digest = hash_token(raw_token)

        ticket = Ticket(
            event_id=event_id,
            registration_id=registration.id,
            token_hash=token_digest,
            status="ACTIVE",
        )
        self.db.add(ticket)
        await self.db.flush()

        # 8. Enqueue Email Outbox Record with AES-256-GCM Encrypted Token
        encrypted_token = encrypt_payload(raw_token)
        outbox_item = EmailOutbox(
            event_id=event_id,
            ticket_id=ticket.id,
            recipient_email=normalized_email,
            subject=f"Your Admission Ticket — {event.title}",
            encrypted_token_payload=encrypted_token,
            status="PENDING",
            attempts=0,
        )
        self.db.add(outbox_item)

        # 9. Append Audit Log
        audit = AuditLog(
            event_id=event_id,
            action="REGISTRATION_CREATED",
            entity_type="registration",
            entity_id=registration.id,
            payload_diff={
                "form_response_id": payload.response_id,
                "email": normalized_email,
                "ticket_id": str(ticket.id),
                "urn": urn_val,
            },
        )
        self.db.add(audit)

        await self.db.commit()
        return RegistrationResponse.model_validate(registration), "registered"

    async def create_manual_registration(
        self,
        event_id: UUID,
        payload: ManualRegistrationCreate,
    ) -> Tuple[RegistrationResponse, str]:
        synthetic_response_id = f"MANUAL-{secrets.token_hex(8)}"
        webhook_payload = GoogleFormsWebhookPayload(
            response_id=synthetic_response_id,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            urn=payload.urn,
            attending=payload.attending or "Yes",
            custom_fields={"source": "manual_entry", "urn": payload.urn, "attending": payload.attending},
        )
        raw_bytes = synthetic_response_id.encode("utf-8")
        return await self.process_google_forms_submission(
            event_id=event_id,
            payload=webhook_payload,
            raw_body_bytes=raw_bytes,
        )
