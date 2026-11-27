# ADR-0001: Modular Monolith Architecture

## Status
Accepted

## Context
EventFlow is a multi-event RSVP, digital ticketing, and QR-based attendance management system. The system requires clean domain boundaries, secure multi-tenant isolation per event, asynchronous processing for webhook ingestion and email dispatch, and low-latency atomic ticket validation at venue check-in gates.

A common pitfall is prematurely decomposing a new system into microservices, which introduces distributed transaction failures, network latency, distributed tracing overhead, deployment complexity, and complex data consistency issues.

## Decision
We adopt a **modular monolith** architecture for the backend:
- The backend is written in Python (FastAPI + SQLAlchemy 2.0 async + asyncpg).
- Clear domain boundaries are enforced through package structure (`domains/events`, `domains/registrations`, `domains/ticketing`, `domains/checkin`, `domains/email`, etc.).
- Cross-domain communication is handled via internal domain service interfaces or asynchronous transactional outbox patterns.
- Background worker execution (for email delivery and retry handling) shares the domain logic and database schema but runs as an independent worker process on Render.
- Frontend is implemented as a unified Next.js App Router Progressive Web Application (PWA).

## Consequences
### Positive
- Single database transaction boundary guarantees atomic state transitions (e.g. check-in recording, webhook idempotency).
- Simplified deployment and CI/CD via Docker and GitHub Actions.
- Zero network serialization overhead for internal domain calls.
- High developer velocity and straightforward local testing.

### Negative / Trade-offs
- Domains must be disciplined about not making direct cross-domain private ORM joins without passing through service interfaces.
- Scaling individual endpoints independently requires horizontal scaling of the entire monolith container (mitigated by separating the web service and the background worker process).
