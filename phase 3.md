
PHASE 3: RSVP INTEGRATION, TICKETING AND EMAIL DELIVERY

Act as a Senior Backend Engineer, Distributed Systems
Engineer and Integration Engineer.

Implement the complete registration and ticket-delivery
workflow on top of the existing Phase 2 foundation.

Do not rebuild working authentication or database
infrastructure.

STEP 1 — GOOGLE APPS SCRIPT

Create a complete Google Apps Script integration.

Use an installable Google Forms submission trigger.

Use the Google Form response ID as the unique
external submission identifier.

Map form question responses into this payload:

{
  "response_id": "stable-google-response-id",
  "name": "Attendee Name",
  "email": "attendee@example.com",
  "phone": "contact-number"
}

Include event-specific configuration.

Do not hardcode webhook credentials.

Store webhook secrets using Script Properties.

STEP 2 — WEBHOOK AUTHENTICATION

Implement:

POST /v1/webhooks/google-forms/{event_id}

Use HMAC-SHA256 request signing.

Sign the exact raw request body together with
a timestamp.

Validate:

- Signature.
- Timestamp freshness.
- Event identity.
- Payload structure.
- Request size.
- Replay protection.

Use constant-time signature comparison.

Never log the raw webhook secret or attendee PII.

STEP 3 — IDEMPOTENCY

Implement idempotent webhook processing.

Enforce a unique database constraint on:

(event_id, source, source_response_id)

If a request is repeated, it must not create another
registration or another ticket.

Return a deterministic response for duplicate requests.

Handle the same email being submitted multiple times
according to the business uniqueness policy.

STEP 4 — REGISTRATION SERVICE

Create a dedicated registration domain service.

The service should:

1. Validate the event.
2. Validate registration status.
3. Normalize attendee data.
4. Validate the email.
5. Check duplicate policy.
6. Create the registration.
7. Create the ticket.
8. Create the email outbox record.
9. Write an audit event.
10. Commit everything in one transaction.

If any critical database operation fails, roll back
the registration and associated ticket.

STEP 5 — TICKET GENERATION

Generate tokens using Python's secrets module.

Use at least 256 bits of randomness.

Store a SHA-256 hash of the raw token for lookup.

Do not use:

- UUIDs as bearer tokens.
- Sequential IDs.
- Attendee email addresses.
- Database IDs as QR credentials.

Generate QR images using the Python qrcode library.

QR codes must contain only a versioned opaque ticket
credential.

STEP 6 — TEMPORARY TOKEN ENCRYPTION

The email worker requires the raw ticket token.

Store the temporary token inside the email outbox
using authenticated encryption such as AES-256-GCM.

Include encryption key versioning.

Never store encryption keys in PostgreSQL.

Delete the encrypted temporary token after successful
provider acceptance, subject to the documented retry
and retention policy.

Support safe key rotation.

STEP 7 — TRANSACTIONAL OUTBOX

Implement an email_outbox worker.

Use PostgreSQL row locking with SKIP LOCKED or an
equivalent safe job-claiming mechanism.

Include:

- PENDING.
- PROCESSING.
- SENT.
- RETRY.
- DEAD_LETTER.
- attempts.
- next_attempt_at.
- lease_expires_at.
- provider_message_id.
- last_error_code.

Use exponential backoff with jitter.

Recover expired worker leases.

Never hold a registration transaction open while
calling Resend.

Make processing idempotent.

Use the same ticket for email retries.

Document the possibility of duplicate emails after
ambiguous provider timeouts.

STEP 8 — RESEND INTEGRATION

Create an isolated Resend client adapter.

Implement:

- Valid email template.
- Event branding.
- Attendee name.
- Event information.
- Ticket QR attachment.
- Ticket instructions.
- Error handling.
- Provider response tracking.

Never expose ticket tokens in email tracking URLs.

Never claim that a message was delivered merely
because the email API accepted it.

STEP 9 — APPS SCRIPT RETRIES

Implement a durable synchronization status.

Track:

- Response ID.
- Processing status.
- Attempt count.
- Next retry time.
- Last error category.

Use a scheduled trigger for pending failed submissions.

Do not depend on automatic trigger retries alone.

Avoid unbounded immediate retry loops.

STEP 10 — ADMIN OPERATIONS

Implement secure operations for:

- Viewing registrations.
- Viewing ticket status.
- Resending an email.
- Revoking a ticket.
- Reissuing a ticket where authorized.

Reissued tickets must invalidate the previous ticket.

STEP 11 — TESTING

Test:

- Valid registration.
- Invalid webhook signature.
- Expired webhook timestamp.
- Replayed webhook.
- Duplicate response ID.
- Duplicate attendee email.
- Invalid event.
- Cancelled registration.
- QR token generation.
- Token hash verification.
- Encrypted token recovery.
- Resend success.
- Resend failure.
- Worker crash and retry.
- Duplicate email-job processing.

STEP 12 — SECURITY REVIEW

Verify that:

- Webhook secrets are protected.
- Raw QR credentials are not logged.
- Ticket hashes are stored correctly.
- Encryption keys are not committed.
- Duplicate registrations are prevented.
- Email jobs are recoverable.
- Ticket revocation works.
- Unauthorized resend operations are blocked.

DELIVERABLES:

- Complete Apps Script.
- FastAPI registration module.
- Ticket generation module.
- Secure QR generator.
- Transactional email outbox.
- Background worker.
- Resend integration.
- Automated integration tests.
- Registration and email documentation.

ACCEPTANCE CRITERIA:

A real Google Form submission must create exactly
one registration and one ticket.

The attendee must receive the corresponding QR email.

Repeating the same form response must not create
a second registration or ticket.

An email provider failure must not destroy the
registration.

An administrator must be able to resend an email
without issuing another ticket.

Wait for Phase 4.
