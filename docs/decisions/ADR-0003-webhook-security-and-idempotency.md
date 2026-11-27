# ADR-0003: Webhook Security, Signature Verification, and Idempotency

## Status
Accepted

## Context
EventFlow ingests attendee RSVPs from Google Forms via Google Apps Script triggers sending HTTP POST webhooks to FastAPI.
Google Forms webhooks are vulnerable to:
1. Forged payload injection by unauthorized third parties.
2. Webhook replay attacks.
3. Duplicate submission processing caused by network retries or double form submissions.
4. Brute force attempts to push arbitrary registrations.

Furthermore, spreadsheet row numbers are unstable (rows can be reordered, sorted, or deleted) and must never be used as a business key.

## Decision
1. **Webhook Authentication**:
   - Every webhook request must contain a cryptographic signature in the `X-Webhook-Signature` header computed as `HMAC-SHA256(webhook_secret, request_body_bytes)`.
   - FastAPI validates the signature using constant-time comparison (`hmac.compare_digest`) before parsing or processing the body.
2. **Replay Attack Defense**:
   - The webhook payload must include an ISO-8601 timestamp (`submitted_at`) and an integer epoch timestamp in `X-Webhook-Timestamp`.
   - The backend enforces a strict **5-minute clock drift tolerance window** (`|current_time - request_time| <= 300 seconds`). Requests outside this window are rejected with `400 Bad Request`.
3. **Stable Idempotency Key**:
   - Google Apps Script retrieves the native Google Form response ID via `FormResponse.getId()`.
   - This globally unique, immutable string is transmitted as `form_response_id`.
   - The backend stores every received request in a `webhook_receipts` table with a unique constraint on `(event_id, form_response_id)`.
   - If a duplicate `form_response_id` is received, the backend returns `200 OK` with the existing registration status without reprocessing or re-dispatching emails.

## Consequences
### Positive
- Eliminates forged RSVP injections.
- Defeats replay attacks using expired timestamps.
- Guarantees exactly-once processing regardless of network instability or script retries.
- Resilient to Google Sheet editing or row reordering.

### Negative / Trade-offs
- Google Apps Script must be configured with the shared secret per event.
- Requires synchronized system clocks (NTP).
