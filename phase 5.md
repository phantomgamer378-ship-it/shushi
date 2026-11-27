
PHASE 5: END-TO-END TESTING, DEPLOYMENT AND
PRODUCTION HARDENING

Act as a Principal DevOps Engineer, Senior QA Engineer,
Application Security Engineer and Senior
Forward Deployed Engineer.

Your task is to integrate, test and prepare the entire
EventFlow platform for production.

Do not rewrite stable modules unnecessarily.

STEP 1 — COMPLETE SYSTEM INTEGRATION

Verify communication between:

- Google Forms.
- Google Apps Script.
- FastAPI.
- Supabase PostgreSQL.
- Supabase Auth.
- Email worker.
- Resend.
- Next.js frontend.
- Mobile QR scanner.

Verify all API contracts.

Fix any mismatch between frontend and backend.

STEP 2 — END-TO-END USER JOURNEY

Implement an end-to-end test covering:

1. Create an event.
2. Submit an RSVP.
3. Deliver webhook.
4. Create registration.
5. Generate ticket.
6. Queue email.
7. Process email job.
8. Retrieve QR ticket.
9. Authenticate staff.
10. Scan QR.
11. Validate ticket.
12. Record check-in.
13. Display dashboard update.

Test actual state transitions.

STEP 3 — CONCURRENCY TESTING

Test simultaneous submissions of the same ticket.

Use real PostgreSQL and independent database
sessions.

Send at least 20 concurrent requests against the
same ticket.

Exactly one request must successfully consume it.

All others must return a duplicate result.

Also test concurrent duplicate RSVP webhooks.

STEP 4 — FAILURE TESTING

Simulate:

- Database unavailable.
- Resend unavailable.
- Worker crash.
- Worker lease expiration.
- Invalid JWT.
- Expired session.
- Invalid webhook signature.
- Duplicate webhook delivery.
- Camera permission denied.
- Network disconnection during scanning.
- Backend timeout.
- Email provider timeout after possible acceptance.

Verify safe recovery.

Never allow unverified entry during backend failure.

STEP 5 — SECURITY TESTING

Perform a threat-driven security review.

Test for:

- IDOR.
- Broken access control.
- SQL injection.
- XSS.
- CSRF where applicable.
- JWT misuse.
- Webhook replay.
- QR credential disclosure.
- Ticket guessing.
- Brute-force API requests.
- Excessive information exposure.
- Insecure database grants.
- Cross-event data access.

Verify that event-level authorization works on
the server, not merely in the frontend.

Review dependencies for known vulnerabilities.

STEP 6 — PERFORMANCE TESTING

Load test:

- Registration webhooks.
- Concurrent QR scans.
- Dashboard statistics.
- Attendee search.
- Email queue processing.

Establish reasonable performance targets.

Measure:
- Request latency.
- p95 latency.
- Error rate.
- Database connections.
- Lock contention.
- Worker throughput.
- Email queue backlog.

Do not claim performance guarantees without
measured results.

STEP 7 — OBSERVABILITY

Implement:

- Structured application logging.
- Request correlation IDs.
- Error tracking.
- Health endpoints.
- Worker health reporting.
- Queue monitoring.
- Failed email alerts.
- Unusual scan alerts.

Never log raw QR tokens, credentials or sensitive
attendee information.

STEP 8 — CI/CD

Create GitHub Actions workflows.

On pull requests, run:

- Python linting.
- Python tests.
- Type checking.
- Frontend linting.
- TypeScript checks.
- Frontend tests.
- Integration tests.
- Dependency scanning.
- Build validation.

Do not automatically deploy unreviewed changes
to production.

STEP 9 — DATABASE DEPLOYMENT

Configure controlled Alembic migrations.

Use a separate migration role.

Never run uncontrolled schema creation on startup.

Define migration backup and rollback procedures.

Verify migrations on staging before production.

STEP 10 — RENDER DEPLOYMENT

Prepare:

- FastAPI Web Service.
- Background Worker.
- Environment variables.
- Health check endpoints.
- Correct binding to 0.0.0.0.
- Correct service start command.
- Logging.
- Graceful shutdown.
- Database connection configuration.

Verify actual Render networking compatibility
with the selected Supabase connection method.

STEP 11 — VERCEL DEPLOYMENT

Prepare:

- Next.js production build.
- Environment configuration.
- Authentication URLs.
- API base URL.
- CORS compatibility.
- PWA metadata.
- HTTPS.
- Production camera permissions.

STEP 12 — OPERATIONAL READINESS

Create:

- Deployment runbook.
- Rollback runbook.
- Database backup procedure.
- Restore procedure.
- Incident response guide.
- Event-day check-in guide.
- Staff onboarding guide.
- Secret rotation guide.
- Troubleshooting guide.

STEP 13 — FINAL SECURITY SIGN-OFF

Produce a security assessment containing:

- Identified threats.
- Tests performed.
- Tests passed.
- Tests failed.
- Open vulnerabilities.
- Accepted residual risks.
- Required fixes.

Do not declare the application secure if any
critical or high-severity issue remains unresolved.

STEP 14 — RELEASE APPROVAL

Create a production readiness checklist.

Do not deploy to production until:

- Integration tests pass.
- Concurrency tests pass.
- Security checks pass.
- Staging deployment works.
- Database backup exists.
- Restore procedure is validated.
- Event-day network is tested.
- Staff accounts are configured.

DELIVERABLES:

Production-ready source code.
CI/CD workflows.
Deployment configuration.
Test reports.
Security assessment.
Monitoring setup.
Operational runbooks.
Production readiness report.

At the end, provide a final architecture and
deployment summary.

Clearly distinguish implemented, tested,
deployed and verified features.

Do not claim production deployment if only local
testing has been performed.
