
PHASE 2: BACKEND FOUNDATION, DATABASE AND SECURITY

Act as a Principal Backend Engineer, PostgreSQL
Database Architect and Application Security Engineer.

Implement the backend foundation defined in Phase 1.

Do not implement the complete registration or email
business workflows yet.

STEP 1 — FASTAPI APPLICATION

Create a production-ready FastAPI application.

Use:

- Pydantic v2.
- SQLAlchemy 2.x asynchronous ORM.
- asyncpg.
- Alembic.
- Dependency injection.
- Lifespan management.
- Centralized exception handlers.
- Structured logging.

Organize code into:

- core
- api
- domains
- infrastructure
- integrations
- workers

Use clear separation between API, service, repository
and infrastructure responsibilities.

STEP 2 — CONFIGURATION

Create strongly validated environment configuration.

Include:

DATABASE_URL
SUPABASE_URL
SUPABASE_AUTH configuration
WEBHOOK_SECRET configuration
TICKET_ENCRYPTION_KEY
RESEND_API_KEY
FRONTEND_ORIGINS
ENVIRONMENT

Never commit actual credentials.

Provide .env.example with placeholder values only.

STEP 3 — DATABASE CONNECTION

Integrate Supabase PostgreSQL through SQLAlchemy.

Inspect the actual Supabase connection options and
the deployment network compatibility.

Choose the correct connection method:

- Direct connection where supported.
- Session pooler for suitable IPv4-only persistent
  backend deployments.
- Transaction pooler only for compatible workloads.

Configure:

- SSL.
- Pool size.
- Pool timeout.
- Connection recycling.
- Connection health checks.
- Clean session lifecycle.

Do not assume every pooler supports session state
or prepared statements.

Do not use Supabase service_role credentials as the
normal application database connection.

STEP 4 — DATABASE SCHEMA

Create Alembic migrations for:

1. events
2. event_staff
3. registrations
4. tickets
5. check_ins
6. webhook_receipts
7. email_outbox
8. scanner_devices
9. audit_logs

Use UUID primary keys.

Include created_at and updated_at where appropriate.

Add:

- Foreign keys.
- Unique constraints.
- Composite indexes.
- Status check constraints.
- Referential integrity.
- Appropriate cascading restrictions.

Ensure one active registration per event and normalized
attendee email, unless an explicitly authorized
business rule permits another registration.

Use a stable external response ID for webhook
idempotency.

A ticket must belong to one registration.

A successful check-in must belong to one ticket.

Only one successful check-in may exist per ticket.

Avoid storing a redundant checked_in boolean when
a check-in record provides the authoritative state.

STEP 5 — DATABASE ACCESS SECURITY

Create a dedicated application database role.

Keep application tables inside a private schema.

Separate migration permissions from runtime permissions.

Enable and configure appropriate RLS policies.

IMPORTANT:
The direct SQLAlchemy database connection must not
silently be treated as if it carries Supabase Auth JWT
claims.

Document exactly how authenticated user identity and
event authorization are enforced.

If transaction-local database identity context is used,
set it only after verifying the staff JWT and event
membership, and make missing context default-deny.

Never use SECURITY DEFINER merely to bypass a
permission problem.

Verify database grants, RLS policies and access
boundaries with actual tests.

STEP 6 — AUTHENTICATION

Integrate Supabase Auth for staff identities.

Implement:

- JWT signature verification.
- Issuer verification.
- Audience verification.
- Expiration validation.
- Allowed algorithm verification.
- JWKS/key rotation handling as appropriate.
- Session revocation strategy.
- Staff account deactivation.

Do not trust user-editable metadata for authorization.

STEP 7 — RBAC

Implement event-scoped roles:

OWNER
ADMIN
CHECKIN_STAFF
VIEWER

Create centralized authorization dependencies.

Every sensitive route must explicitly specify its
required permissions.

Prevent IDOR and cross-event access.

STEP 8 — DATABASE TRANSACTIONS

Create reusable transaction boundaries.

Keep transaction ownership clear.

Never perform email network requests while holding
database locks.

Design interfaces for:

- Registration transactions.
- Ticket transactions.
- Check-in transactions.
- Outbox processing transactions.

STEP 9 — API FOUNDATION

Implement:

GET /health/live
GET /health/ready
GET /v1/auth/me
GET /v1/events
POST /v1/events
GET /v1/events/{event_id}

Add standardized error responses and request IDs.

STEP 10 — TESTING

Write:

- Model tests.
- Repository tests.
- Migration tests.
- Authentication tests.
- RBAC tests.
- Cross-event access tests.
- Invalid JWT tests.
- Database permission tests.

Use a real PostgreSQL test database for integration
tests where database behaviour matters.

STEP 11 — SECURITY REVIEW

Inspect:

- Database grants.
- RLS configuration.
- Secret exposure.
- JWT verification.
- SQL injection.
- Object-level authorization.
- Transaction management.
- Sensitive logging.
- Dependency vulnerabilities.

Fix discovered issues before proceeding.

DELIVERABLES:

A runnable FastAPI backend foundation.
Alembic migrations.
Database schema.
Authentication and RBAC.
Automated tests.
Updated architecture documentation.
Updated threat model.

ACCEPTANCE CRITERIA:

1. Backend starts successfully.
2. Database connection works.
3. All migrations run cleanly on an empty test DB.
4. Valid staff authentication works.
5. Invalid and expired authentication is rejected.
6. Cross-event access is denied.
7. Database privileges are verified.
8. Tests pass.
9. No real secrets exist in the repository.

Wait for Phase 3 after reporting completion.
