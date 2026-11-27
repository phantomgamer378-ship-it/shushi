
============================================================
EVENTFLOW — FINAL UI/UX DESIGN AND FRONTEND INTEGRATION
MASTER IMPLEMENTATION PROMPT
============================================================

ROLE:

Act as a Principal Product Designer, Senior UI/UX
Architect, Advanced 3D Interface Designer, Senior
Frontend Engineer and Design Systems Engineer.

You have extensive professional experience designing
and developing enterprise SaaS products, event
management platforms, sophisticated dashboards,
mobile applications and immersive web experiences.

You have deep expertise in:

- Product design and UX architecture.
- Design systems.
- Premium SaaS dashboard design.
- 3D web interfaces.
- Glassmorphism.
- Spatial UI and depth.
- Motion design.
- Interaction design.
- Responsive web design.
- Accessibility.
- Next.js and TypeScript.
- Frontend architecture.
- API integration.
- Performance optimization.

PROJECT:

EventFlow — Multi-Event RSVP, Ticketing and QR
Attendance Management Platform.

PRIMARY OBJECTIVE:

Complete the visual design, UX architecture, component
system, frontend implementation and integration of
the existing EventFlow platform.

IMPORTANT:

This is NOT a request to create a static visual mockup.

You must implement actual, functional, production-
oriented UI components connected to the existing
FastAPI backend and Supabase Auth architecture.

The existing backend and its API contracts are the
source of truth.

Do not invent fake backend functionality.

Do not replace working business logic with local
mock data.

============================================================
PART 1 — REPOSITORY AND ARCHITECTURE INSPECTION
============================================================

Before writing frontend code:

1. Inspect the entire existing repository.

2. Understand the completed implementation of all
   five engineering phases.

3. Inspect:
   - Existing Next.js application.
   - Existing components.
   - Existing routing.
   - Existing authentication.
   - Existing API client.
   - Existing TypeScript interfaces.
   - Existing scanner implementation.
   - Existing Tailwind configuration.
   - Existing PWA configuration.
   - Existing test suite.

4. Read:
   - docs/architecture.md
   - docs/LLD.md
   - docs/api-contracts.md
   - docs/threat-model.md
   - docs/implementation-status.md

5. Identify visual inconsistencies and UX problems.

6. Identify incomplete interfaces and missing states.

7. Identify backend integration mismatches.

8. Produce a short frontend audit before modification.

Do not blindly overwrite existing components.

Preserve tested backend functionality.

Do not change database structure or API contracts
unless a genuine integration defect is found and
documented.

============================================================
PART 2 — PRODUCT DESIGN STRATEGY
============================================================

Establish a premium visual identity for EventFlow.

PRODUCT PERSONALITY:

- Premium.
- Intelligent.
- Futuristic.
- Professional.
- Trustworthy.
- Minimal.
- Fast.
- Operationally efficient.

DESIGN DIRECTION:

Combine premium SaaS design with restrained 3D
spatial interfaces.

The application should feel like a sophisticated
modern event operations platform.

Avoid:
- Generic admin dashboard designs.
- Excessive gradients.
- Excessive glassmorphism.
- Excessive shadows.
- Unnecessary animations.
- Random decorative illustrations.
- Inconsistent spacing.
- Overcrowded cards.
- Poor information hierarchy.

The final application should look intentionally
designed rather than assembled from unrelated UI kits.

============================================================
PART 3 — BRAND AND VISUAL DESIGN SYSTEM
============================================================

BRAND NAME:

EventFlow

BRAND MESSAGE:

The future of effortless event management.

Create a consistent design system.

COLOR PALETTE:

Primary Midnight:
#10172A

Deep Navy:
#18233D

Primary Indigo:
#635BFF

Accent Cyan:
#36C8E8

Success:
#16A34A

Warning:
#EAAA24

Error:
#DC4545

Neutral:
#64748B

Light Background:
#F4F6FB

Light Surface:
#FFFFFF

Dark Surface:
#111827

Define semantic design tokens for:
- Backgrounds.
- Foregrounds.
- Muted text.
- Borders.
- Primary actions.
- Secondary actions.
- Success.
- Warning.
- Error.
- Focus rings.
- Shadows.
- Surface elevations.

Use both light and dark themes where appropriate.

SCANNER:
Use a dedicated high-contrast dark theme.

DASHBOARD:
Provide a polished, readable light-theme experience
and support dark theme consistently.

TYPOGRAPHY:

Use:
- Inter for application text.
- Manrope for selected display headings.
- JetBrains Mono for technical identifiers.

Use a consistent typographic hierarchy.

SPACING:

Use a 4px-based spacing system.

Prefer consistent:
- 8px.
- 12px.
- 16px.
- 24px.
- 32px.
- 48px.

BORDER RADIUS:

- Inputs: 10px.
- Buttons: 10px.
- Cards: 16px.
- Dialogs: 20px.
- Large feature panels: 24px.

Define all reusable tokens centrally.

Do not scatter arbitrary colors and spacing values
throughout the component implementation.

============================================================
PART 4 — 3D UI AND SPATIAL DESIGN
============================================================

Use 3D design selectively.

Create a coherent spatial interface language.

VISUAL EFFECTS:

- Subtle glass panels.
- Layered cards.
- Soft ambient lighting.
- Controlled gradients.
- Realistic depth.
- Subtle reflections.
- Gentle shadows.
- Perspective transforms.
- Smooth micro-interactions.

USE 3D IN:

1. Login hero section.
2. Landing or workspace welcome section.
3. Digital ticket preview.
4. Selected dashboard feature cards.
5. Empty-state illustrations.
6. Event creation showcase.

Use CSS 3D transforms for lightweight elements.

Use Framer Motion for interaction and transitions.

Use React Three Fiber only where a genuinely
interactive 3D experience provides value.

Optimize all 3D elements.

Requirements:

- Lazy load heavy 3D scenes.
- Provide static fallbacks.
- Respect prefers-reduced-motion.
- Avoid unnecessary WebGL contexts.
- Avoid continuous animations.
- Never block critical user interactions.
- Never degrade scanner performance.

Do not introduce complex 3D content merely for
decoration.

============================================================
PART 5 — APPLICATION INFORMATION ARCHITECTURE
============================================================

Implement the following application routes.

AUTHENTICATION:

/login
/forgot-password

MAIN APPLICATION:

/events
/events/[eventId]
/events/[eventId]/registrations
/events/[eventId]/scanner
/events/[eventId]/attendance
/events/[eventId]/reports
/events/[eventId]/staff
/events/[eventId]/settings

Use the existing route architecture if an equivalent
implementation already exists.

Create a consistent application shell.

DESKTOP SHELL:

- Left sidebar.
- Brand logo.
- Workspace selector if appropriate.
- Event navigation.
- Main content.
- Top navigation.
- Profile menu.
- Notifications.
- Breadcrumbs.
- Contextual action buttons.

MOBILE SHELL:

- Responsive top header.
- Mobile navigation.
- Full-screen scanner layout.
- Large touch-friendly controls.
- Simplified data presentation.

Ensure route-based navigation never exposes
unauthorized content.

============================================================
PART 6 — LOGIN AND AUTHENTICATION EXPERIENCE
============================================================

Design a premium login screen.

Desktop:
- Two-column layout.
- 3D event ticket or abstract event illustration.
- Clear branding.
- Authentication panel.
- Premium but restrained visual hierarchy.

Mobile:
- Compact single-column design.
- Minimal decorative artwork.

Features:

- Email input.
- Password input.
- Show/hide password.
- Validation.
- Loading state.
- Invalid credentials state.
- Session handling.
- Password recovery.
- Accessible error messages.

Integrate the existing Supabase Auth implementation.

Never create a second independent authentication
system.

Never expose sensitive authentication credentials.

After authentication, resolve the user's authorized
event access before choosing the landing page.

============================================================
PART 7 — ADMIN DASHBOARD EXPERIENCE
============================================================

Create an elegant and functional dashboard.

DASHBOARD COMPONENTS:

1. Welcome section.
2. Event overview.
3. Registration count.
4. Confirmed registrations.
5. Tickets issued.
6. Email delivery statistics.
7. Successful check-ins.
8. Remaining eligible attendees.
9. Attendance percentage.
10. Registration trends.
11. Check-in activity timeline.
12. Recent attendee activity.

Each metric card must include:

- Clear label.
- Actual value.
- Appropriate icon.
- Supporting context.
- Loading state.
- Empty state.
- Error state.

Use consistent card hierarchy.

Charts must use actual API responses.

Never hardcode production analytics.

Implement filters where supported by backend
contracts.

Use skeleton placeholders during data loading.

============================================================
PART 8 — EVENT MANAGEMENT EXPERIENCE
============================================================

Implement a guided event creation wizard.

STEP 1: BASIC INFORMATION

- Event name.
- Description.
- Cover image.
- Venue.
- Organizer details.

STEP 2: SCHEDULE

- Event date.
- Start time.
- End time.
- Timezone.
- Check-in start time.
- Check-in end time.

STEP 3: REGISTRATION

- Google Form connection.
- Registration window.
- Registration status.
- Attendee rules.
- Duplicate registration policy.

STEP 4: REVIEW AND PUBLISH

- Configuration summary.
- Event preview.
- Registration configuration.
- Ticket email preview.
- Publishing confirmation.

Use actual backend event management APIs.

Support:
- Save draft.
- Edit event.
- Publish.
- Cancel event.
- Close registration.

Implement confirmation dialogs for destructive
actions.

Preserve form data after validation errors.

============================================================
PART 9 — ATTENDEE MANAGEMENT EXPERIENCE
============================================================

Create a premium data management interface.

Include:

- Search.
- Filtering.
- Sorting.
- Pagination.
- CSV export.
- Registration details.
- Ticket status.
- Email status.
- Attendance status.
- Attendee detail drawer.

Columns:

- Attendee name.
- Email.
- Phone where authorized.
- Registration date.
- Ticket status.
- Email delivery status.
- Check-in status.

Use semantic status indicators.

Do not combine unrelated statuses.

Make large tables responsive.

On mobile, use attendee cards or a deliberate
compact layout instead of shrinking desktop tables.

Provide explicit empty, loading and error states.

============================================================
PART 10 — MOBILE QR SCANNER UX
============================================================

THIS IS THE HIGHEST-PRIORITY INTERFACE.

The scanner is designed primarily for smartphones.

Use @zxing/browser with the existing scanner
integration where possible.

SCANNER DESIGN:

- Dedicated dark interface.
- Large camera preview.
- Clearly visible scanning frame.
- Rear-facing camera by default.
- Camera switching control.
- Flashlight control where browser support exists.
- Start and stop camera controls.
- Manual attendee lookup.
- Network connection indicator.
- Current event details.
- Check-in counters.

CAMERA STATES:

IDLE
PERMISSION_REQUEST
SCANNING
VERIFYING
SUCCESS
DUPLICATE
INVALID
REVOKED
EXPIRED
NETWORK_ERROR
CAMERA_ERROR

Implement a well-defined scanner state machine.

Prevent duplicate submissions from the same camera
frame.

Avoid concurrent check-in requests for the same
detected credential.

Use the backend response as the only source of truth.

SUCCESS:

- Large green confirmation.
- Attendee name.
- Event name.
- Check-in timestamp.
- Clear visual feedback.
- Optional vibration and success sound.

DUPLICATE:

- Amber or yellow warning.
- Display that the ticket has already been used.
- Show previous check-in time when authorized.

INVALID:

- Red rejection.
- Clear explanation.
- No admission action.

NETWORK ERROR:

- Display that verification is unavailable.
- Never grant entry offline.
- Provide a controlled retry action.

After showing a result, resume scanning only if
the scanner is still active and the staff member
has not stopped it.

STOP camera streams when leaving the scanner route.

Handle browser visibility changes and camera errors.

Use strong contrast for outdoor environments.

Keep animations short.

Prioritize camera responsiveness above visual effects.

============================================================
PART 11 — ATTENDANCE AND REPORTING EXPERIENCE
============================================================

Create an analytics interface containing:

- Total eligible attendees.
- Tickets issued.
- Successful check-ins.
- Remaining attendees.
- Attendance percentage.
- Check-ins over time.
- Registrations over time.
- Staff check-in activity.
- Downloadable attendance report.

Filters:

- Event.
- Date range.
- Attendance status.
- Registration status.

Every chart and statistic must come from a
documented backend API.

Provide export loading and completion states.

Protect personally identifiable information.

============================================================
PART 12 — DIGITAL EMAIL TICKET EXPERIENCE
============================================================

Create an elegant ticket email design system.

The ticket design must include:

- Event brand.
- Attendee name.
- Event date.
- Event location.
- Ticket identifier.
- High-resolution QR image.
- Entry instructions.
- Contact information.

The QR must:

- Have sufficient resolution.
- Include a proper quiet zone.
- Have high contrast.
- Avoid overlays or decorative text.
- Remain scannable across phone displays.

Create a responsive HTML email template.

Use the existing Resend integration.

Do not create new ticket credentials during
an email resend operation.

============================================================
PART 13 — MOTION DESIGN AND MICRO-INTERACTIONS
============================================================

Use consistent motion rules.

Examples:

- Button press feedback.
- Card hover elevation.
- Sidebar transitions.
- Modal entrance and exit.
- Dropdown transitions.
- Chart entrance animations.
- Success confirmation animation.
- Loading skeleton shimmer.

Keep standard transitions short and purposeful.

Respect prefers-reduced-motion.

Do not animate large areas continuously.

Never delay or interfere with ticket check-in
operations.

============================================================
PART 14 — DESIGN SYSTEM AND REUSABLE COMPONENTS
============================================================

Create centralized reusable components.

CORE:

- Button.
- Input.
- Select.
- Textarea.
- Checkbox.
- Radio group.
- Modal.
- Drawer.
- Dropdown.
- Tabs.
- Tooltip.
- Badge.
- Avatar.
- Card.
- Table.
- Pagination.
- Toast.
- Skeleton.
- EmptyState.
- ErrorState.

APPLICATION:

- AppSidebar.
- AppHeader.
- EventSwitcher.
- EventCard.
- MetricCard.
- AttendeeTable.
- AttendeeDrawer.
- EventWizard.
- AttendanceChart.
- ActivityTimeline.
- ScannerViewport.
- ScannerStatus.
- ScanResult.
- TicketPreview.
- ConfirmDialog.

Maintain consistent component variants.

Avoid duplicating the same UI implementation.

Use TypeScript interfaces for component props.

Avoid unnecessary component abstraction.

============================================================
PART 15 — FRONTEND API INTEGRATION
============================================================

Use the existing centralized typed API client.

Integrate with documented FastAPI endpoints.

Preserve:

- API authentication.
- Session handling.
- Request IDs.
- Error handling.
- Response typing.
- Event-level permissions.

Do not:

- Use Supabase database writes directly from the
  browser for business-critical operations.
- Hardcode sample production metrics.
- Implement fake check-in logic locally.
- Bypass backend permissions.
- Store raw QR tokens.
- Cache ticket validation responses.
- Modify the backend schema to accommodate
  superficial frontend design preferences.

If an endpoint is missing, document the missing
contract rather than inventing fake success data.

============================================================
PART 16 — ACCESSIBILITY AND RESPONSIVE DESIGN
============================================================

Target WCAG 2.2 AA where applicable.

Implement:

- Semantic HTML.
- Keyboard navigation.
- Accessible labels.
- Screen-reader feedback.
- Visible focus states.
- Contrast compliance.
- Appropriate touch targets.
- Reduced-motion support.
- Responsive typography.
- Accessible forms.
- Accessible charts and tables.

Test:

Desktop: 1280px and above.
Tablet: 768px–1279px.
Mobile: below 768px.

Prioritize small mobile devices for scanner testing.

Ensure no horizontal overflow on standard screens.

============================================================
PART 17 — PERFORMANCE OPTIMIZATION
============================================================

Optimize:

- Initial JavaScript bundle.
- Component rendering.
- Image sizes.
- 3D assets.
- Dynamic imports.
- Scanner initialization.
- Camera stream cleanup.
- API request volume.
- Dashboard rendering.

Avoid unnecessary rerenders.

Avoid loading large 3D assets on the scanner route.

Use lazy loading for noncritical visual content.

Ensure the scanner remains responsive on
mid-range smartphones.

============================================================
PART 18 — FRONTEND TESTING
============================================================

Use the existing testing stack.

Test:

- Login flows.
- Route authorization.
- Event selection.
- Dashboard loading.
- Event creation.
- Attendee management.
- Form validation.
- Scanner state machine.
- Camera permission failures.
- Duplicate scan suppression.
- Backend error display.
- Network disconnection.
- Responsive layouts.

Use Playwright for end-to-end workflows.

Use deterministic camera mocks for UI tests.

Perform real-device camera tests separately.

Verify that scanner outcomes always follow
actual backend responses.

============================================================
PART 19 — VISUAL QUALITY ASSURANCE
============================================================

Perform a complete visual audit.

Review every route at:

- Desktop.
- Tablet.
- Mobile.

Check:

- Alignment.
- Spacing.
- Typography.
- Contrast.
- Component consistency.
- Empty states.
- Loading states.
- Error states.
- Modal positioning.
- Text overflow.
- Mobile navigation.
- Scanner readability.

Use browser screenshots or visual regression tests
where the environment supports them.

Identify and correct inconsistencies.

Do not mark a page complete simply because
it renders without an exception.

============================================================
PART 20 — FINAL DELIVERABLES
============================================================

Produce:

1. Complete frontend design system.
2. Centralized design tokens.
3. Reusable component library.
4. Responsive application shell.
5. Premium authentication interface.
6. Admin dashboard.
7. Event creation and management interface.
8. Attendee management interface.
9. Mobile-first QR scanner interface.
10. Attendance analytics interface.
11. Email ticket visual template.
12. Motion and interaction system.
13. Accessibility implementation.
14. Responsive implementation.
15. UI testing suite.
16. Visual QA report.
17. Frontend implementation documentation.

UPDATE:

docs/implementation-status.md
docs/api-contracts.md
docs/architecture.md

Include design decisions in the project documentation.

============================================================
PART 21 — FINAL ACCEPTANCE CRITERIA
============================================================

The implementation is complete only when:

1. All application routes are implemented.
2. All interfaces use a consistent design system.
3. The frontend uses the actual backend contracts.
4. Authentication works.
5. Event-level role permissions are respected.
6. Dashboard metrics use real data.
7. Attendee data is searchable and filterable.
8. Event creation works.
9. The mobile camera opens successfully.
10. QR detection works on real devices.
11. The scanner sends credentials to FastAPI.
12. Valid tickets show successful entry.
13. Duplicate tickets show rejection.
14. Invalid tickets show rejection.
15. Network errors fail closed.
16. Camera streams are properly cleaned up.
17. PWA behaviour is correct.
18. Mobile, tablet and desktop layouts are tested.
19. Accessibility issues are addressed.
20. Security boundaries remain intact.
21. All critical frontend tests pass.
22. No placeholder production analytics remain.
23. No broken navigation or dead buttons remain.

============================================================
EXECUTION PROTOCOL
============================================================

Do not attempt to redesign the entire application
in one huge code change.

Implement incrementally:

STEP A:
Repository and UI audit.

STEP B:
Design tokens and component foundation.

STEP C:
Application shell and authentication.

STEP D:
Dashboard and event management.

STEP E:
Attendee management and analytics.

STEP F:
Mobile QR scanner.

STEP G:
Email ticket visual integration.

STEP H:
Motion, accessibility and responsive polish.

STEP I:
API and end-to-end integration tests.

STEP J:
Visual and functional QA.

After each step:

- Show files modified.
- Run relevant tests.
- Capture screenshots where available.
- Identify remaining issues.
- Fix defects before moving on.

Do not change established backend contracts
without documenting and approving the change.

Do not claim functionality has been tested
without actually running the tests.

FINAL REPORT:

Provide:

- Implemented routes.
- Implemented components.
- Design system summary.
- API integration summary.
- Scanner compatibility report.
- Accessibility review.
- Responsive testing results.
- Performance findings.
- Remaining known issues.

Your final objective is to make EventFlow feel like
a cohesive, premium, production-oriented product
while preserving every critical business and
security guarantee of the existing backend.

============================================================
END OF MASTER UI/UX PROMPT
============================================================
