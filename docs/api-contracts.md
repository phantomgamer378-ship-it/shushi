# EventFlow — REST API Contract Specification (/v1)

**Phase**: Phase 1: Product Discovery & System Architecture  
**Document**: API Contract Design Document  
**Version**: 1.0.0  
**Base Path**: `/v1`  
**Status**: APPROVED

---

## 1. Global Conventions & Standards

- **Protocol**: HTTPS only (TLS 1.3).
- **Format**: JSON (`Content-Type: application/json; charset=utf-8`).
- **Authentication**:
  - Protected endpoints require `Authorization: Bearer <Supabase_JWT_Access_Token>`.
  - Inbound webhook endpoints require `X-Webhook-Signature: <Hex_HMAC_SHA256>` and `X-Webhook-Timestamp: <Unix_Epoch_Seconds>`.
- **Error Format**: RFC 7807 Problem Details:
  ```json
  {
    "type": "https://errors.eventflow.io/TICKET_ALREADY_USED",
    "title": "Ticket Already Checked In",
    "status": 409,
    "detail": "Ticket was already consumed at 2026-11-27T08:30:15Z by Staff gate-1.",
    "instance": "/v1/events/8c59f07a-.../check-in",
    "code": "TICKET_ALREADY_USED",
    "timestamp": "2026-11-27T08:31:00Z"
  }
  ```
- **Standard HTTP Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Malformed payload or validation error.
  - `401 Unauthorized`: Missing or invalid JWT.
  - `403 Forbidden`: Authenticated user lacks event-scoped permissions.
  - `404 Not Found`: Resource does not exist in the requested event scope.
  - `409 Conflict`: Business invariant collision (e.g. ticket already consumed, duplicate email).
  - `422 Unprocessable Entity`: Pydantic validation failure.
  - `429 Too Many Requests`: Rate limit exceeded.
  - `500 Internal Server Error`: Unhandled server exception.

---

## 2. API Endpoints Catalog

### 2.1 Webhook Integration

#### `POST /v1/webhooks/google-forms`
Ingests RSVP submissions from Google Apps Script.

- **Headers**:
  - `Content-Type: application/json`
  - `X-Webhook-Signature: <hmac_hex>`
  - `X-Webhook-Timestamp: <timestamp>`
- **Request Body**:
  ```json
  {
    "event_id": "8c59f07a-d04b-4886-8f3a-23b6b1be2c01",
    "form_response_id": "2_ABaOnuc-1X_sampleFormId99",
    "submitted_at": "2026-11-27T08:15:30Z",
    "attendee": {
      "name": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "phone": "+919876543210"
    },
    "custom_fields": {
      "tshirt_size": "L",
      "dietary_preference": "Vegetarian"
    }
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "action": "registered",
      "registration_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "message": "Registration processed and ticket queued for delivery."
    }
    ```
  - `200 OK` (Duplicate idempotent replay):
    ```json
    {
      "status": "success",
      "action": "already_processed",
      "registration_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "message": "Duplicate submission acknowledged; existing registration retained."
    }
    ```
  - `400 Bad Request`: Timestamp expired (`CLOCK_DRIFT_EXCEEDED`) or invalid HMAC signature (`INVALID_SIGNATURE`).
  - `409 Conflict`: Registration capacity reached or duplicate email with distinct form ID.

---

### 2.2 Event Management

#### `POST /v1/events`
Creates a new event. (Requires Platform Owner or Event Creator).
- **Request Body**:
  ```json
  {
    "slug": "mumbai-tech-summit-2026",
    "title": "Mumbai Tech Summit 2026",
    "description": "Annual cloud & security engineering conference.",
    "venue_name": "Jio World Convention Centre, BKC, Mumbai",
    "start_time": "2026-12-10T09:00:00+05:30",
    "end_time": "2026-12-10T18:00:00+05:30",
    "timezone": "Asia/Kolkata",
    "max_capacity": 500
  }
  ```
- **Response**: `201 Created` returning the created event entity including generated webhook credentials.

#### `GET /v1/events`
Lists all events accessible to the authenticated caller.
- **Query Params**: `status`, `limit` (default 20, max 100), `offset` (default 0).
- **Response**: `200 OK` with paginated event summaries.

#### `GET /v1/events/{event_id}`
Retrieves detailed event configuration.
- **Response**: `200 OK` with full event metadata.

#### `PATCH /v1/events/{event_id}`
Updates event properties (title, capacity, status).
- **Response**: `200 OK` with updated event record.

---

### 2.3 Staff Management

#### `POST /v1/events/{event_id}/staff`
Assigns staff to an event. (Requires Event Owner or Admin).
- **Request Body**:
  ```json
  {
    "user_email": "staff.rohit@example.com",
    "role": "staff"
  }
  ```
- **Response**: `201 Created` mapping record.

#### `GET /v1/events/{event_id}/staff`
Lists assigned staff members and their roles.
- **Response**: `200 OK` with staff list.

#### `DELETE /v1/events/{event_id}/staff/{staff_id}`
Revokes a user's staff assignment for the event.
- **Response**: `200 OK`.

---

### 2.4 Registrations & Ticketing

#### `GET /v1/events/{event_id}/registrations`
Lists attendees for an event. (Requires Event Owner or Admin).
- **Query Params**: `status`, `search` (name or email), `limit`, `offset`.
- **Response**: `200 OK` paginated attendee list.

#### `POST /v1/events/{event_id}/tickets/{ticket_id}/revoke`
Revokes an active ticket.
- **Request Body**:
  ```json
  {
    "reason": "Attendee requested cancellation"
  }
  ```
- **Response**: `200 OK` (`status: REVOKED`).

#### `POST /v1/events/{event_id}/tickets/{ticket_id}/resend`
Generates a fresh raw token, revokes the previous token hash, and re-enqueues ticket email.
- **Response**: `200 OK` (`status: REISSUED`).

---

### 2.5 Check-In & Gate Admission

#### `POST /v1/events/{event_id}/check-in`
Validates and atomically consumes a QR code token at the gate.
- **Headers**:
  - `Authorization: Bearer <Staff_JWT>`
- **Request Body**:
  ```json
  {
    "raw_token": "a4B9_vX81lKmNpQ7rStUvWxYz0123456789-_sampleToken",
    "device_id": "5c4d3e2a-1b0a-4c9d-8e7f-6a5b4c3d2e1f",
    "gate_name": "Gate 3 - VIP & Main Entrance",
    "idempotency_key": "9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f"
  }
  ```
- **Responses**:
  - `200 OK` (Admission Granted):
    ```json
    {
      "status": "ADMITTED",
      "ticket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "attendee_name": "Aarav Sharma",
      "gate_name": "Gate 3 - VIP & Main Entrance",
      "checked_in_at": "2026-11-27T08:35:12.124Z",
      "message": "Welcome to Mumbai Tech Summit 2026!"
    }
    ```
  - `404 Not Found` (`INVALID_TICKET`):
    ```json
    {
      "code": "INVALID_TICKET",
      "message": "Token not found or does not belong to this event."
    }
    ```
  - `400 Bad Request` (`TICKET_REVOKED`):
    ```json
    {
      "code": "TICKET_REVOKED",
      "message": "This ticket has been revoked by event organizers."
    }
    ```
  - `409 Conflict` (`ALREADY_CHECKED_IN`):
    ```json
    {
      "code": "ALREADY_CHECKED_IN",
      "message": "Ticket has already been consumed.",
      "first_checked_in_at": "2026-11-27T08:15:00Z",
      "gate_name": "Gate 1 - North Entrance"
    }
    ```

---

### 2.6 Attendance Analytics & Audit

#### `GET /v1/events/{event_id}/attendance`
Real-time attendance summary and velocity metrics.
- **Response**: `200 OK`:
  ```json
  {
    "total_registrations": 450,
    "total_checked_in": 312,
    "attendance_percentage": 69.33,
    "gates": [
      {"gate_name": "Gate 1", "count": 190},
      {"gate_name": "Gate 2", "count": 122}
    ],
    "last_hour_throughput": 84
  }
  ```

#### `GET /v1/events/{event_id}/audit-logs`
Retrieves chronological audit trail. (Requires Event Owner or Platform Owner).
- **Response**: `200 OK` paginated audit trail.

#### `GET /v1/health`
Service heartbeat endpoint.
- **Response**: `200 OK` (`{"status": "healthy", "database": "connected", "region": "ap-south-1"}`).
