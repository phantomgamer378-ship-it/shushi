# ADR-0004: Cryptographic Token Generation, Storage Hashing, and Outbox Encryption

## Status
Accepted

## Context
QR code tickets are high-value credentials that grant access to events. If raw QR tokens are stored in plain text in the database, any read-only SQL leakage, database backup compromise, or log leakage allows an attacker to clone attendee tickets.

At the same time:
1. QR codes must NOT contain attendee Personal Identifiable Information (PII) such as names, phone numbers, or email addresses.
2. The system must render the QR code with the raw token to send it via email (Resend) asynchronously via background workers.
3. Once generated and dispatched, the raw token must never be retrievable from the database in plain text.

## Decision
1. **Raw Token Generation**:
   - Every ticket token is generated using Python's `secrets.token_urlsafe(32)`, yielding 256 bits of cryptographic entropy.
   - The token contains no attendee PII.
2. **Database Storage (One-Way Hash)**:
   - The database table `tickets` stores only `token_hash = SHA-256(raw_token)` as a 64-character hexadecimal string, indexed with a unique B-tree index.
   - When a ticket is scanned at the venue, the scanner sends `raw_token`. The backend computes `SHA-256(raw_token)` and looks up the ticket by `token_hash`.
3. **Outbox Encryption for Background Dispatch**:
   - The temporary background email delivery queue (`email_outbox`) requires the raw token so the email worker can render the QR code PNG and email attachment.
   - The raw token in `email_outbox` is encrypted at rest using **Authenticated AES-256-GCM** with a dedicated rotating environment key (`TICKET_ENCRYPTION_KEY`).
   - Upon successful email delivery through Resend, the outbox record's encrypted token payload is wiped (`NULL`ed) and status is set to `SENT`.

## Consequences
### Positive
- Even with full read access to the database or backups, an adversary cannot forge or reconstruct attendee QR codes.
- Zero PII in QR codes prevents over-the-shoulder snooping and public QR leakage privacy breaches.
- Cryptographic guarantee that only the email recipient and the physical holder of the QR code possess the valid admission token.

### Negative / Trade-offs
- If an attendee loses their email, an admin cannot "read back" their existing raw QR code from the database. Re-issuing requires revoking the old ticket and generating a fresh token with a new email dispatch.
