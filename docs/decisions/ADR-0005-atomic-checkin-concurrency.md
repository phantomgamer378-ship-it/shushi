# ADR-0005: Atomic Ticket Check-in and Concurrency Control

## Status
Accepted

## Context
At physical event entrances, high attendee throughput and network flakiness often result in race conditions:
1. Two staff scanners scanning the exact same QR code simultaneously at different gates.
2. Rapid double-tapping of the scan button on mobile scanner clients.
3. Network replay of check-in requests.

If check-in logic performs a non-atomic "check then update" (`SELECT checked_in FROM tickets ... if not checked_in: UPDATE tickets SET checked_in = TRUE`), two concurrent requests will both read `checked_in == FALSE` and admit the ticket twice.

## Decision
We enforce concurrency control and atomic consumption at both the PostgreSQL row-lock level and unique constraint level:

1. **Transactional Row Locking**:
   - Every check-in operation runs inside a dedicated PostgreSQL transaction with `SERIALIZABLE` or `READ COMMITTED` isolation.
   - The ticket record is locked exclusively using:
     ```sql
     SELECT id, event_id, status, is_consumed
     FROM tickets
     WHERE token_hash = :token_hash
     FOR UPDATE;
     ```
   - If `status != 'ACTIVE'` or `is_consumed == TRUE`, the transaction fails immediately and returns `409 Conflict` (Ticket Already Used or Revoked).
2. **Database Unique Constraint Enforcement**:
   - Check-in history is tracked in a separate `check_ins` table with:
     ```sql
     ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
     UNIQUE (ticket_id)
     ```
   - This database-level unique constraint makes it physically impossible for two rows to be inserted for the same ticket, even in the event of an application software bug.
3. **Atomic Flag Update**:
   - In the same database transaction, the ticket is marked:
     ```sql
     UPDATE tickets
     SET is_consumed = TRUE, consumed_at = NOW(), updated_at = NOW()
     WHERE id = :ticket_id;
     ```
4. **Idempotent Scan Token**:
   - Mobile scanners attach a unique client-generated UUID `idempotency_key` per scan attempt. Repeated submissions with the same key return the original atomic scan result without error.

## Consequences
### Positive
- Strict prevention of ticket double-use under any concurrency level or network race condition.
- Zero reliance on application-layer distributed locks (e.g. Redis), reducing operational dependencies.
- Audit trail recorded in `check_ins` with timestamp, staff ID, scanner device ID, and gate location.

### Negative / Trade-offs
- Slight lock contention if multiple requests target the same ticket simultaneously; however, one request immediately succeeds and the second fails instantly with `409 Conflict`.
