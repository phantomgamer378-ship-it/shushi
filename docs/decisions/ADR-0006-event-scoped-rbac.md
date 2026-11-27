# ADR-0006: Event-Scoped Role-Based Access Control (RBAC)

## Status
Accepted

## Context
EventFlow is a multi-event platform. A staff member or organizer authorized for Event A must never be able to view attendees, scan tickets, or modify settings for Event B.

Supabase Auth provides user identity (JWT), but user authorization must be strictly evaluated per event context.

## Decision
1. **User Identity & Event Scoping**:
   - Authentication is handled by Supabase Auth (verifying signed JWTs).
   - Authorization is enforced by the FastAPI backend using custom dependency injection (`RequireEventRole`).
   - The `event_staff` table maps `(event_id, user_id, role)`:
     ```sql
     CREATE TABLE event_staff (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
         user_id UUID NOT NULL, -- references auth.users
         role VARCHAR(32) NOT NULL, -- 'owner', 'admin', 'staff', 'viewer'
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         UNIQUE (event_id, user_id)
     );
     ```
2. **Role Hierarchy**:
   - **Platform Owner**: Global superuser (defined via environment or platform table).
   - **Event Owner**: Full control over specific event, forms, staff assignment, and ticket revocation.
   - **Event Admin**: Can manage registrations, resend tickets, and view analytics; cannot remove the Event Owner.
   - **Check-in Staff**: Restricted strictly to ticket validation (`POST /v1/events/{id}/check-in`) and device registration. Zero access to attendee PII or billing.
   - **Read-only Viewer**: Can view dashboard analytics and attendance metrics only.
3. **Fail-Closed Authorization**:
   - Every API request targeting `/v1/events/{event_id}/*` validates that the caller has an active record in `event_staff` matching or exceeding the required permission.
   - Any query omitting an `event_id` or attempting to access an unauthorized event results in `403 Forbidden`.

## Consequences
### Positive
- Prevents horizontal privilege escalation (IDOR) across different events.
- Least-privilege access for gate staff prevents leaks of full attendee contact databases.
- Auditable staff assignment history.

### Negative / Trade-offs
- Requires checking `event_staff` table on every authenticated API request (optimized via compound index on `(user_id, event_id)`).
