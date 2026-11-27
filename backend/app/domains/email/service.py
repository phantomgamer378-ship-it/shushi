import logging
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.domains.email.models import EmailOutbox
from app.domains.events.models import Event
from app.domains.registrations.models import Registration
from app.domains.ticketing.models import Ticket
from app.domains.email.qr import generate_qr_code_png
from app.domains.email.resend_adapter import ResendEmailAdapter
from app.core.security import decrypt_payload

logger = logging.getLogger("eventflow.worker")

MAX_OUTBOX_ATTEMPTS = 5
BASE_BACKOFF_SECONDS = 15


class EmailOutboxService:
    def __init__(self, db: AsyncSession, email_adapter: Optional[ResendEmailAdapter] = None):
        self.db = db
        self.email_adapter = email_adapter or ResendEmailAdapter()

    async def process_pending_batch(self, batch_size: int = 10) -> int:
        """
        Claims and processes pending email outbox jobs using FOR UPDATE SKIP LOCKED.
        Guarantees zero database lock retention during external HTTP calls to Resend.
        """
        now = datetime.now(timezone.utc)

        # 1. Claim batch with SKIP LOCKED
        claim_query = (
            select(EmailOutbox)
            .where(
                EmailOutbox.status.in_(["PENDING", "RETRY"]),
                EmailOutbox.next_retry_at <= now,
            )
            .with_for_update(skip_locked=True)
            .limit(batch_size)
        )
        res = await self.db.execute(claim_query)
        items: List[EmailOutbox] = list(res.scalars().all())

        if not items:
            return 0

        # Mark claimed items as PROCESSING and commit claim transaction
        for item in items:
            item.status = "PROCESSING"
        await self.db.commit()

        processed_count = 0

        # 2. Process each item outside of lock
        for item in items:
            try:
                # Fetch associated event and registration
                event_res = await self.db.execute(select(Event).where(Event.id == item.event_id))
                event = event_res.scalars().first()

                ticket_res = await self.db.execute(select(Ticket).where(Ticket.id == item.ticket_id))
                ticket = ticket_res.scalars().first()

                reg_res = await self.db.execute(select(Registration).where(Registration.id == ticket.registration_id))
                registration = reg_res.scalars().first()

                # Decrypt raw token
                raw_token = decrypt_payload(item.encrypted_token_payload)

                # Generate in-memory QR PNG
                qr_png = generate_qr_code_png(raw_token)

                # Send via Resend Adapter (no database lock held during HTTP call)
                self.email_adapter.send_ticket_email(
                    recipient_email=item.recipient_email,
                    attendee_name=registration.attendee_name if registration else "Attendee",
                    event_title=event.title if event else "Your Event",
                    venue_name=event.venue_name if event else "Venue",
                    start_time_str=event.start_time.strftime("%B %d, %Y at %I:%M %p") if event else "",
                    qr_png_bytes=qr_png,
                )

                # 3. Mark SENT and wipe encrypted token payload
                item.status = "SENT"
                item.sent_at = datetime.now(timezone.utc)
                item.encrypted_token_payload = None  # WIPE RAW CREDENTIAL UPON CONFIRMED DISPATCH
                item.last_error = None
                processed_count += 1
                logger.info("Successfully sent ticket email for outbox ID: %s", str(item.id))

            except Exception as e:
                logger.error("Failed to process email outbox %s: %s", str(item.id), str(e))
                item.attempts += 1
                item.last_error = str(e)

                if item.attempts >= MAX_OUTBOX_ATTEMPTS:
                    item.status = "DEAD_LETTER"
                    logger.warning("Outbox ID %s exceeded max retries (%d). Transitioned to DEAD_LETTER.", str(item.id), MAX_OUTBOX_ATTEMPTS)
                else:
                    item.status = "RETRY"
                    # Exponential backoff with jitter: 2^attempts * BASE + jitter(1-5s)
                    backoff = (2 ** item.attempts) * BASE_BACKOFF_SECONDS + random.randint(1, 5)
                    item.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=backoff)

            self.db.add(item)
            await self.db.commit()

        return processed_count
