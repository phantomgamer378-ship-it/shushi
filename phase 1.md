
PHASE 1: PRODUCT DISCOVERY AND SYSTEM ARCHITECTURE

Act as a Principal Software Architect and Senior
Forward Deployed Engineer.

Your task is to design EventFlow before implementing
its business features.

STEP 1 — REPOSITORY INSPECTION

Inspect the repository and identify:

- Existing files and folders.
- Existing implementations.
- Existing dependencies.
- Existing configuration.
- Missing components.
- Technical debt.
- Security problems.

Do not delete or overwrite existing work.

STEP 2 — REQUIREMENT ENGINEERING

Define functional requirements for:

1. Event management.
2. Google Forms registration.
3. Registration processing.
4. Unique ticket generation.
5. Email delivery.
6. Staff authentication.
7. Event-based authorization.
8. Mobile QR scanning.
9. Atomic check-in.
10. Attendance reporting.
11. Ticket cancellation and revocation.
12. Audit logging.

Define non-functional requirements:

- Security.
- Reliability.
- Availability.
- Maintainability.
- Performance.
- Scalability.
- Observability.
- Privacy.
- Data consistency.

STEP 3 — DEFINE USER ROLES

Design these roles:

- Platform Owner.
- Event Owner.
- Event Admin.
- Check-in Staff.
- Read-only Viewer.

Define exactly what each role can and cannot do.

An event's staff must not access another event's data
unless explicitly authorized.

STEP 4 — HIGH-LEVEL DESIGN

Create architecture diagrams using Mermaid.

Include:

- System context diagram.
- Container diagram.
- Component diagram.
- Registration sequence diagram.
- Ticket generation sequence diagram.
- Check-in sequence diagram.
- Email retry sequence diagram.

Identify responsibilities of every component.

STEP 5 — DOMAIN DESIGN

Define the following domains:

- Event Management.
- Staff Management.
- Registration.
- Ticketing.
- Check-in.
- Email Delivery.
- Webhook Integration.
- Reporting.
- Audit Logging.

For each domain, define:

- Entities.
- Responsibilities.
- Business rules.
- Input/output contracts.
- Dependencies.
- Failure scenarios.

STEP 6 — DOMAIN STATES

Define state machines for:

Registration:
PENDING -> CONFIRMED -> CANCELLED

Ticket:
ACTIVE -> REVOKED

Email:
PENDING -> PROCESSING -> SENT
PROCESSING -> RETRY -> PROCESSING
PROCESSING -> DEAD_LETTER

Check-in:
NOT_CHECKED_IN -> CHECKED_IN

Document allowed and forbidden transitions.

STEP 7 — DATA FLOW

Document how data moves from Google Forms through
Apps Script, FastAPI, PostgreSQL, QR generation,
Resend and the mobile scanner.

Use a stable external Google Form response ID.

A spreadsheet row number must not be the permanent
registration idempotency identifier.

STEP 8 — DATABASE DESIGN

Create an initial ER diagram for:

- events
- event_staff
- registrations
- tickets
- check_ins
- webhook_receipts
- email_outbox
- scanner_devices
- audit_logs

Identify primary keys, foreign keys, unique constraints,
indexes and deletion policies.

STEP 9 — API CONTRACT DESIGN

Define REST endpoint names, methods, request models,
response models, status codes and error codes.

Use /v1 API versioning.

Do not implement business logic yet.

STEP 10 — SECURITY THREAT MODEL

Identify threats including:

- Forged webhook requests.
- Webhook replay attacks.
- Duplicate registrations.
- QR token theft.
- Ticket cloning.
- Unauthorized check-in.
- Cross-event access.
- JWT misuse.
- SQL injection.
- Brute-force scanning.
- Sensitive information leakage.
- Email abuse.
- Denial of service.

For each threat, define mitigation and a test scenario.

STEP 11 — PROJECT STRUCTURE

Design a modular monorepo for:

frontend/
backend/
automation/
infrastructure/
docs/

Define the exact purpose of every major folder.

STEP 12 — ARCHITECTURE REVIEW

Before proceeding, review the architecture for:

- Unnecessary complexity.
- Circular dependencies.
- Duplicate responsibilities.
- Transaction boundary problems.
- Security gaps.
- Inconsistent data ownership.

DELIVERABLES:

Create all Phase 1 documentation.

Create initial project scaffolding only.

Do not implement ticket issuance, registration
processing, or scanner business logic.

ACCEPTANCE CRITERIA:

1. Every feature has a documented requirement.
2. Every domain has a defined responsibility.
3. Every API contract is documented.
4. Every core entity has a defined relationship.
5. Critical workflows have sequence diagrams.
6. Security threats have mitigations.
7. Architecture decisions are recorded.
8. No contradictory architecture decisions remain.

At the end, provide a Phase 1 completion report
and wait for the Phase 2 instruction.
