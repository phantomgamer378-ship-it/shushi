# EventFlow Production Runbook & Operational Procedures

This operational runbook provides production recovery, key rotation, incident response, and performance monitoring procedures for **EventFlow**.

---

## 1. System Architecture Overview

- **Frontend**: Next.js 14 App Router, Tailwind CSS, ZXing barcode scanner, deployed to Vercel CDN.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy Async (asyncpg), deployed on Render web service.
- **Worker Daemon**: Transactional email outbox worker (`worker.py`), polling `email_outbox` with exponential backoff and jitter.
- **Database**: Supabase PostgreSQL 17.12 in region `ap-south-1` (Mumbai, India).
  - Port `6543`: Supavisor transaction pooler for application runtime (FastAPI).
  - Port `5432`: Supavisor session pooler for Alembic DDL migrations.

---

## 2. Emergency Escalation & Incidents

### A. High Check-In Rejection Rate at Event Gate
1. **Symptoms**: Attendees receiving `INVALID_TICKET` or scanner showing unrecognized codes.
2. **Diagnosis**:
   - Check if event is active: `SELECT status FROM events WHERE id = '<event_id>';`. If in `DRAFT` or `COMPLETED`, check-in is rejected.
   - Verify token format: Gate scanner expects raw tokens prefixed with `ef:v1:`. If raw token without prefix is scanned, the parser extracts the raw secret.
3. **Mitigation**:
   - Event organizers can manually look up attendee name in the **Registrations** tab of the dashboard and verify confirmed RSVP status.

### B. Duplicate Check-in Attempt Alarm
1. **Symptoms**: Scanner flashes RED `ALREADY_CHECKED_IN` for an arriving guest.
2. **Diagnosis**:
   - Query: `SELECT * FROM check_ins WHERE ticket_id = '<ticket_id>';`.
   - Check `checked_in_at` and `gate_name`.
3. **Mitigation**:
   - If previous check-in occurred seconds ago at the same gate, it is a duplicate scan / double tap.
   - If previous check-in occurred at a different gate or earlier time, escort attendee to the supervisor desk for badge reprint verification.

### C. Email Outbox Processing Backlog
1. **Symptoms**: Attendee registered via Google Forms but has not received ticket email within 60 seconds.
2. **Diagnosis**:
   - Check worker health:
     ```bash
     ps aux | grep worker.py
     ```
   - Check pending outbox entries:
     ```sql
     SELECT status, COUNT(*) FROM email_outbox GROUP BY status;
     SELECT * FROM email_outbox WHERE status = 'FAILED' ORDER BY created_at DESC LIMIT 10;
     ```
3. **Mitigation**:
   - If Resend API rate limit or outage: outbox items automatically transition to `RETRYING` with exponential backoff (`delay = 2^attempts * 5s`).
   - Re-enqueue failed jobs:
     ```sql
     UPDATE email_outbox SET status = 'PENDING', attempts = 0 WHERE status = 'FAILED';
     ```

---

## 3. Cryptographic Key Rotation Procedures

### A. Rotating Data Encryption Key (`DATA_ENCRYPTION_KEY`)
`DATA_ENCRYPTION_KEY` is a 256-bit AES-GCM key used to encrypt raw tokens in the transient `email_outbox` table and webhook secrets in `events`.
1. Ensure all `email_outbox` records in status `PENDING` have been sent:
   ```sql
   SELECT COUNT(*) FROM email_outbox WHERE status IN ('PENDING', 'RETRYING');
   ```
2. Generate new 32-byte URL-safe base64 key:
   ```bash
   python -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"
   ```
3. Re-encrypt existing `events.webhook_secret_hash` records with old key, re-encrypt with new key, and update `.env`.

### B. Rotating Webhook Secret for an Event
If an event's webhook secret is accidentally leaked or compromised:
1. Re-generate a new 32-byte secret in python:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Encrypt and update event row:
   ```python
   from app.core.security import encrypt_payload
   new_secret_ciphertext = encrypt_payload(new_secret)
   # UPDATE events SET webhook_secret_hash = new_secret_ciphertext WHERE id = '<event_id>';
   ```
3. Update Google Apps Script `WEBHOOK_SECRET` in the Google Form properties.

---

## 4. Database Maintenance & Alembic Migrations

- **Applying Migrations**:
  Always set port 5432 (Session pooler) when executing DDL migrations:
  ```bash
  cd backend
  DATABASE_URL="postgresql+asyncpg://postgres.jkchyjghuaiyulxqzobl:EventFlow2026!SecureMumbaiDB@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" \
  .venv/bin/alembic upgrade head
  ```
- **Checking Migration Status**:
  ```bash
  .venv/bin/alembic current
  ```
- **Never Execute `create_all()` in Production**: All schemas must strictly follow version-controlled migrations in `backend/alembic/versions/`.
