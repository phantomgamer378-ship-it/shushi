
PHASE 4: MOBILE SCANNER AND ADMIN FRONTEND

Act as a Senior Full-Stack Engineer, Mobile Web
Engineer and Product UI Engineer.

Implement the complete Next.js frontend using the
existing Phase 1-3 backend contracts.

Do not modify backend business logic unless a
documented API contract mismatch is discovered.

STEP 1 — NEXT.JS FOUNDATION

Use:

- Next.js App Router.
- TypeScript strict mode.
- Tailwind CSS.
- Component-based architecture.
- PWA support.
- Proper loading and error states.

Create a reusable design system.

Use consistent:
- Typography.
- Spacing.
- Colours.
- Buttons.
- Forms.
- Modals.
- Tables.
- Notifications.
- Error messages.

STEP 2 — AUTHENTICATION

Integrate Supabase Auth using the current recommended
Next.js server-side authentication approach.

Implement:

- Login.
- Logout.
- Session refresh.
- Protected routes.
- Staff profile.
- Event access verification.

Verify sessions on the server where appropriate.

Do not expose Supabase secret keys.

Do not give frontend users direct access to sensitive
database operations.

The frontend must communicate with FastAPI for
business operations.

STEP 3 — EVENT INTERFACE

Create:

/login
/events
/events/[id]
/events/[id]/registrations
/events/[id]/scanner
/events/[id]/attendance
/events/[id]/settings
/events/[id]/staff

Apply role-specific UI capabilities.

STEP 4 — SCANNER PWA

Create a mobile-first QR scanner.

Use @zxing/browser and verify its current API.

Implement:

- Camera permission.
- Rear camera selection.
- Camera switching.
- Camera start and stop.
- QR frame detection.
- Duplicate-frame suppression.
- Scan request throttling.
- API integration.
- Clear result presentation.
- Camera cleanup on unmount.
- Manual attendee search.

Keep scanned credentials in memory only.

Do not store raw ticket tokens in localStorage,
sessionStorage, URLs, browser history or analytics.

STEP 5 — SCANNER STATE MACHINE

Implement explicit UI states:

IDLE
REQUESTING_PERMISSION
SCANNING
VERIFYING
SUCCESS
DUPLICATE
INVALID
REVOKED
NETWORK_ERROR
CAMERA_ERROR

Ensure invalid transitions are impossible.

Prevent concurrent requests for the same scan.

After successful processing, show the result briefly
and automatically return to scanning.

Do not silently restart the camera after the user
has explicitly stopped it.

STEP 6 — API INTEGRATION

Integrate:

GET /v1/auth/me

GET /v1/events

GET /v1/events/{id}

GET /v1/events/{id}/registrations

POST /v1/events/{id}/check-ins

GET /v1/events/{id}/check-ins/stats

GET /v1/events/{id}/check-ins/recent

POST /v1/events/{id}/tickets/{ticket_id}/revoke

POST /v1/events/{id}/tickets/{ticket_id}/resend

Use centralized typed API clients.

Handle:
- 401 unauthorized.
- 403 forbidden.
- 404 not found.
- 409 duplicate check-in.
- 422 validation error.
- 429 rate limit.
- 500 server failure.
- Network failure.

Never assume a successful API response if the
request fails or times out.

STEP 7 — ADMIN DASHBOARD

Create:

- Event overview.
- RSVP statistics.
- Attendance statistics.
- Registration table.
- Search and filters.
- Recent activity.
- CSV export.
- Ticket status management.
- Staff management.
- Responsive charts.

All statistics must originate from authorized
backend responses.

Avoid hardcoded dashboard numbers.

STEP 8 — PWA FUNCTIONALITY

Implement:

- Web app manifest.
- Installable application metadata.
- Appropriate icons.
- Mobile layout.
- Service worker.
- Safe asset caching.

Do not cache authenticated API responses,
QR tokens or attendance mutation requests.

Do not enable offline ticket acceptance.

An unverified ticket must never become an allowed
entry merely because the device is offline.

STEP 9 — UX AND ACCESSIBILITY

Test:

- Small mobile screens.
- Tablets.
- Desktop browsers.
- Poor lighting scan scenarios.
- Slow networks.
- Camera permission rejection.
- Missing camera hardware.
- Browser background/foreground transitions.

Use accessible components and clear feedback.

STEP 10 — FRONTEND TESTING

Write:

- Component tests.
- Authentication tests.
- Route protection tests.
- Scanner state tests.
- API client tests.
- Permission tests.
- Playwright end-to-end tests.

Use mocked camera inputs for deterministic UI tests
and physical devices for actual camera testing.

STEP 11 — SECURITY REVIEW

Verify:

- No secret leakage.
- Proper session handling.
- No cross-event data exposure.
- No client-side authorization assumptions.
- No ticket token persistence.
- No unsafe API caching.
- No insecure offline admission.
- Proper scanner cleanup.

DELIVERABLES:

Complete Next.js frontend.
Mobile scanner PWA.
Admin dashboard.
Reusable UI components.
Authentication integration.
API clients.
Frontend test suite.
Updated documentation.

ACCEPTANCE CRITERIA:

A staff member can authenticate.

An authorized staff member can open an event scanner
on a mobile phone.

The rear camera can detect an attendee QR code.

The scanned credential is sent to FastAPI.

The scanner displays the actual backend response.

A duplicate scan displays a duplicate warning.

A revoked or invalid ticket is rejected.

An unauthorized user cannot access event data.

The scanner does not accept tickets offline.

Wait for Phase 5.
