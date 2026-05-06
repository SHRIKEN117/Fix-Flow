# FixFlow — API Documentation

**Version:** 1.0.0  
**Date:** May 2026  
**Base URL:** `http://localhost:5000/api`  
**Repository:** https://github.com/SHRIKEN117/Fix-Flow

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Response Format](#3-response-format)
4. [Error Codes](#4-error-codes)
5. [Ticket Status Pipeline](#5-ticket-status-pipeline)
6. [Endpoints — Auth](#6-endpoints--auth)
7. [Endpoints — Tickets](#7-endpoints--tickets)
8. [Endpoints — Users](#8-endpoints--users)
9. [Endpoints — Estimates](#9-endpoints--estimates)
10. [Endpoints — Invoices](#10-endpoints--invoices)
11. [Endpoints — Payments](#11-endpoints--payments)
12. [Endpoints — SLA Policies](#12-endpoints--sla-policies)
13. [Endpoints — Dashboard](#13-endpoints--dashboard)
14. [Endpoints — Analytics](#14-endpoints--analytics)
15. [Endpoints — Notifications](#15-endpoints--notifications)
16. [Endpoints — AI Analysis](#16-endpoints--ai-analysis)
17. [Real-Time Events (Socket.io)](#17-real-time-events-socketio)
18. [Feedback & Version Information](#18-feedback--version-information)

---

## 1. Overview

FixFlow is a REST API for a maintenance management system. It supports three user roles — **Admin**, **Technician**, and **User** — with role-based access control enforced on every endpoint.

**Key features exposed via API:**
- Ticket lifecycle management with an enforced status pipeline
- Real-time notifications via Socket.io
- Estimate and invoice workflow with line items
- Payment recording against invoices
- SLA policy enforcement (automatic deadline + breach detection)
- AI-powered ticket image analysis (optional, via Anthropic Claude)

**Authentication mechanism:** JWT stored in an `httpOnly` cookie. The cookie is set automatically on login/register and cleared on logout. All authenticated routes require a valid cookie.

**Content-Type:** All request bodies must be `application/json` unless noted otherwise (file uploads use `multipart/form-data`).

---

## 2. Authentication

All endpoints except `POST /auth/register` and `POST /auth/login` require authentication.

The JWT token is issued as an `httpOnly` cookie named `token` with an 8-hour expiry. Clients do not need to handle the token directly — the browser/HTTP client sends it automatically on each request.

**Role hierarchy:**

| Role | Access Level |
|------|-------------|
| `admin` | Full system access |
| `technician` | Own assigned tickets, own estimates |
| `user` | Own submitted tickets only |

---

## 3. Response Format

All responses follow this envelope:

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable message"
}
```

**Paginated list:**
```json
{
  "success": true,
  "data": [],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## 4. Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Invalid request body, missing fields, or business rule violation |
| `401 Unauthorized` | Missing or invalid JWT token |
| `403 Forbidden` | Valid token but insufficient role permissions |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource (e.g. email already registered) |
| `500 Internal Server Error` | Unexpected server-side error |

---

## 5. Ticket Status Pipeline

Tickets move through a fixed status pipeline. Transitions are role-gated and validated server-side.

```
SUBMITTED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
               ↓
           REJECTED
```

| From | To | Allowed Roles |
|------|----|---------------|
| `SUBMITTED` | `APPROVED` | admin |
| `SUBMITTED` | `REJECTED` | admin |
| `APPROVED` | `ASSIGNED` | admin (via assign endpoint) |
| `ASSIGNED` | `IN_PROGRESS` | technician, admin |
| `IN_PROGRESS` | `COMPLETED` | technician, admin |
| `COMPLETED` | `CLOSED` | admin (blocked if outstanding invoice exists) |

---

## 6. Endpoints — Auth

Base path: `/api/auth`

---

### POST `/auth/register`

Register a new user account.

**Auth required:** No

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Unique email address |
| `password` | string | Yes | Minimum 8 characters |
| `role` | string | Yes | `admin`, `technician`, or `user` |
| `phone` | string | No | Contact phone number |
| `department` | string | No | Department name |
| `specialization` | string | No | Technician specialization (used when role is `technician`) |

**Example request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "technician",
  "specialization": "Electrical"
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "664a1f...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "technician",
    "isActive": true
  },
  "message": "Registration successful"
}
```

**Errors:** `400` (validation failed), `409` (email already registered)

---

### POST `/auth/login`

Authenticate and receive a session cookie.

**Auth required:** No

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Example request:**
```json
{
  "email": "admin@fixflow.com",
  "password": "FixFlow@2025"
}
```

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "_id": "664a1f...",
    "name": "Admin User",
    "email": "admin@fixflow.com",
    "role": "admin",
    "isActive": true,
    "phone": null,
    "department": null
  },
  "message": "Login successful"
}
```

**Errors:** `400` (validation failed), `401` (invalid credentials), `403` (account deactivated)

---

### GET `/auth/me`

Return the currently authenticated user's profile.

**Auth required:** Yes (any role)

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "_id": "664a1f...",
    "name": "Admin User",
    "email": "admin@fixflow.com",
    "role": "admin",
    "isActive": true
  }
}
```

**Errors:** `401` (not authenticated), `404` (user not found)

---

### POST `/auth/logout`

Clear the session cookie.

**Auth required:** No (cookie cleared regardless)

**Response — 200 OK:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 7. Endpoints — Tickets

Base path: `/api/tickets`  
**Auth required:** Yes (all endpoints)

**Visibility rules by role:**
- `admin` — sees all tickets
- `technician` — sees only tickets assigned to them
- `user` — sees only tickets they submitted

---

### GET `/tickets`

List tickets with pagination and filters.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | Filter by status (e.g. `SUBMITTED`, `IN_PROGRESS`) |
| `priority` | string | Filter by priority (`low`, `medium`, `high`, `critical`) |
| `category` | string | Filter by category |
| `slaStatus` | string | Filter by SLA status (`ok`, `warning`, `breached`) |

**Response — 200 OK:**
```json
{
  "success": true,
  "data": [ /* array of ticket objects */ ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

### POST `/tickets`

Create a new maintenance ticket.

**Roles:** `admin`, `user`

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Short ticket title |
| `description` | string | Yes | Detailed problem description |
| `category` | string | Yes | `electrical`, `plumbing`, `hvac`, `structural`, `it`, `other` |
| `customCategory` | string | No | Required when `category` is `other` |
| `location` | string | Yes | Physical location of the issue |
| `imageBase64` | string | No | Base64-encoded image data URI |
| `aiAnalysis` | object | No | Pre-computed AI analysis result (from `/ai/analyze-image`) |

**Example request:**
```json
{
  "title": "Leaking pipe in Room 204",
  "description": "Water dripping from ceiling pipe near window since this morning.",
  "category": "plumbing",
  "location": "Building A, Room 204",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "664b2a...",
    "ticketNumber": "TKT-0042",
    "title": "Leaking pipe in Room 204",
    "status": "SUBMITTED",
    "priority": "medium",
    "category": "plumbing",
    "location": "Building A, Room 204",
    "submittedBy": { "_id": "...", "name": "John Doe", "email": "john@example.com" },
    "slaDeadline": "2026-05-06T12:00:00.000Z",
    "createdAt": "2026-05-05T12:00:00.000Z"
  },
  "message": "Ticket created"
}
```

**Side effects:** Sends confirmation email to submitter (if SMTP configured). Broadcasts `ticket_mutation` Socket.io event.

**Errors:** `400` (validation failed), `403` (role not permitted)

---

### GET `/tickets/:id`

Get a single ticket with full details.

**Response includes:** `nextActions` (valid transitions for the caller's role) and `pipelineStages` (ordered pipeline array).

**Errors:** `403` (user/technician accessing a ticket they don't own), `404`

---

### PATCH `/tickets/:id`

Update ticket fields (title, description, etc.).

**Roles:** `admin`

**Errors:** `400`, `403`, `404`

---

### DELETE `/tickets/:id`

Withdraw/delete a ticket.

**Rules:**
- Admins can delete any ticket at any status
- Users can only delete their own tickets while in `SUBMITTED` status

**Response — 200 OK:**
```json
{ "success": true, "message": "Ticket withdrawn" }
```

**Errors:** `400` (wrong status), `403`, `404`

---

### PATCH `/tickets/:id/status`

Advance or change a ticket's status through the pipeline.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Target status (must be a valid transition) |
| `reason` | string | No | Optional reason for the transition |

**Example request:**
```json
{
  "status": "APPROVED",
  "reason": "Issue verified on-site"
}
```

**Business rules:**
- Transition must be valid for the caller's role (see pipeline table)
- Closing a ticket with an outstanding unpaid invoice returns `400`

**Side effects:** Sends status update email to submitter. Sends Socket.io notification to submitter. Broadcasts `ticket_mutation` event. Updates technician workload when ticket is completed or closed.

**Errors:** `400` (invalid transition or unpaid invoice), `403`, `404`

---

### POST `/tickets/:id/assign`

Assign a technician to a ticket. Sets status to `ASSIGNED`.

**Roles:** `admin`

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `technicianId` | string | Yes | MongoDB ObjectId of the technician user |

**Business rules:** Ticket must be in `APPROVED` status before assignment.

**Side effects:** Sends assignment email to submitter. Sends Socket.io notification to assigned technician. Updates technician workload counters.

**Errors:** `400` (ticket not APPROVED, invalid technician), `403`, `404`

---

### PATCH `/tickets/:id/priority`

Set ticket priority and recompute SLA deadline.

**Roles:** `admin`

**Request body:**

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `priority` | string | Yes | `low`, `medium`, `high`, `critical` |

**Side effects:** Recomputes `slaPolicy` and `slaDeadline` based on the new priority.

**Errors:** `400`, `403`, `404`

---

### GET `/tickets/:id/comments`

List all comments on a ticket in chronological order.

**Response — 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "ticketId": "...",
      "authorId": { "name": "Jane Smith", "email": "jane@example.com", "role": "technician" },
      "body": "Parts ordered, arriving tomorrow.",
      "createdAt": "2026-05-05T14:00:00.000Z"
    }
  ]
}
```

---

### POST `/tickets/:id/comments`

Add a comment to a ticket.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `body` | string | Yes |

**Side effects:** Sends Socket.io notification to the other party (submitter notifies technician, technician notifies submitter).

**Response — 201 Created**

---

### DELETE `/tickets/:id/comments/:commentId`

Delete a comment. Users can only delete their own comments; admins can delete any.

**Errors:** `403`, `404`

---

### GET `/tickets/:id/attachments`

List file attachments for a ticket.

---

### POST `/tickets/:id/attachments`

Upload a file attachment.

**Content-Type:** `multipart/form-data`

**Form field:** `file` — the file to upload (image, PDF, etc.)

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketId": "...",
    "originalName": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 204800,
    "storagePath": "data:image/jpeg;base64,..."
  }
}
```

---

### DELETE `/tickets/:id/attachments/:attachmentId`

Delete an attachment. Users can only delete their own uploads; admins can delete any.

**Errors:** `403`, `404`

---

### GET `/tickets/:id/audit`

Get the full audit log for a ticket in chronological order.

**Roles:** `admin`

**Response data fields:** `action`, `actorId`, `fromValue`, `toValue`, `metadata`, `createdAt`

**Audit actions include:** `TICKET_CREATED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `ASSIGNED`, `COMMENT_ADDED`, `ATTACHMENT_ADDED`, `TICKET_DELETED`, `ESTIMATE_CREATED`, `ESTIMATE_APPROVED`, `ESTIMATE_REJECTED`, `INVOICE_CREATED`, `INVOICE_ISSUED`, `PAYMENT_RECORDED`

---

### GET `/tickets/:id/feedback`

Get user feedback submitted for a resolved ticket.

---

### POST `/tickets/:id/feedback`

Submit feedback for a ticket.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | number | Yes | 1–5 star rating |
| `comment` | string | No | Optional text feedback |

---

## 8. Endpoints — Users

Base path: `/api/users`  
**Auth required:** Yes  
**Roles:** `admin` (all endpoints)

---

### GET `/users`

List all users with pagination.

**Query parameters:** `page`, `limit`

---

### POST `/users`

Create a new user account (admin-side, no self-registration flow).

**Request body:** Same fields as `POST /auth/register`.

**Response — 201 Created**

---

### GET `/users/technicians`

List all active technician users (used for assignment dropdown).

---

### GET `/users/:id`

Get a single user by ID.

**Errors:** `404`

---

### PATCH `/users/:id`

Update user fields (name, email, phone, department).

**Errors:** `404`

---

### PATCH `/users/:id/role`

Change a user's role.

**Request body:**

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `role` | string | Yes | `admin`, `technician`, `user` |

---

### PATCH `/users/:id/deactivate`

Deactivate a user account (prevents login).

---

### PATCH `/users/:id/activate`

Re-activate a previously deactivated user account.

---

### DELETE `/users/:id`

Permanently delete a user.

**Errors:** `404`

---

## 9. Endpoints — Estimates

Base path: `/api/estimates`  
**Auth required:** Yes

**Visibility rules:**
- `admin` — sees all estimates
- `technician` — sees only estimates they created

**Estimate statuses:** `draft` → `submitted` → `approved` / `rejected` / `revision_requested`

---

### GET `/estimates`

List estimates with pagination.

**Roles:** `admin`, `technician`

**Query parameters:** `page`, `limit`

---

### POST `/estimates`

Create a new estimate for an assigned ticket.

**Roles:** `admin`, `technician`

**Business rules:** Technicians can only create estimates for their assigned tickets.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticketId` | string | Yes | ID of the related ticket |
| `items` | array | Yes | Array of line items (see below) |
| `notes` | string | No | Optional notes |
| `taxRate` | number | No | Tax percentage (default: 0) |

**Line item object:**

| Field | Type | Required |
|-------|------|----------|
| `type` | string | Yes — `labour` or `parts` |
| `description` | string | Yes |
| `quantity` | number | Yes |
| `unitPrice` | number | Yes |

**Example request:**
```json
{
  "ticketId": "664b2a...",
  "taxRate": 10,
  "notes": "Parts to be ordered from approved supplier.",
  "items": [
    { "type": "parts", "description": "Copper pipe 2m", "quantity": 2, "unitPrice": 45.00 },
    { "type": "labour", "description": "Installation", "quantity": 3, "unitPrice": 80.00 }
  ]
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "estimateNumber": "EST-0008",
    "status": "draft",
    "subtotal": 330.00,
    "tax": 33.00,
    "total": 363.00,
    "ticketId": { "ticketNumber": "TKT-0042", "title": "Leaking pipe in Room 204" },
    "createdBy": { "name": "Jane Smith", "email": "jane@example.com" }
  },
  "message": "Estimate created"
}
```

---

### GET `/estimates/:id`

Get a single estimate including all line items.

**Roles:** `admin`, `technician`

**Response data includes:** `items` array with full line item details.

---

### PATCH `/estimates/:id`

Update estimate notes or tax rate. Only editable in `draft` or `revision_requested` status.

**Roles:** `admin`, `technician` (own estimates only)

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `notes` | string | No |
| `taxRate` | number | No |

---

### POST `/estimates/:id/items`

Add a line item to an estimate.

**Roles:** `admin`, `technician` (own estimates only)  
**Status required:** `draft` or `revision_requested`

**Request body:** Same as line item object above (`type`, `description`, `quantity`, `unitPrice`).

**Response — 201 Created**

---

### PATCH `/estimates/:id/items/:itemId`

Update an existing line item.

**Roles:** `admin`, `technician` (own estimates only)

---

### DELETE `/estimates/:id/items/:itemId`

Remove a line item. Totals are recomputed automatically.

**Roles:** `admin`, `technician` (own estimates only)

---

### PATCH `/estimates/:id/submit`

Submit a draft estimate for admin review. Changes status to `submitted`.

**Roles:** `admin`, `technician` (own estimates only)  
**Status required:** `draft` or `revision_requested`

---

### PATCH `/estimates/:id/approve`

Approve a submitted estimate. Changes status to `approved`.

**Roles:** `admin`

**Request body:** `{ "notes": "Approved" }` (optional)

---

### PATCH `/estimates/:id/reject`

Reject an estimate. Changes status to `rejected`.

**Roles:** `admin`

**Request body:** `{ "reason": "Budget exceeded" }` (optional)

---

### PATCH `/estimates/:id/request-revision`

Send estimate back for revision. Changes status to `revision_requested`.

**Roles:** `admin`  
**Status required:** `submitted`

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `notes` | string | No | Revision instructions |

---

## 10. Endpoints — Invoices

Base path: `/api/invoices`  
**Auth required:** Yes  
**Roles:** `admin` (all endpoints)

**Invoice statuses:** `draft` → `issued` → `partial` → `paid`

---

### GET `/invoices`

List all invoices with pagination.

**Query parameters:** `page`, `limit`

---

### POST `/invoices`

Create a new invoice, optionally linked to an approved estimate.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticketId` | string | Yes | Related ticket ID |
| `estimateId` | string | No | Approved estimate ID to pull totals from |
| `dueDate` | string (ISO 8601) | No | Payment due date |
| `taxRate` | number | No | Tax percentage (used only when no estimateId) |

**Business rules:** If `estimateId` is provided, the estimate must have `approved` status.

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "invoiceNumber": "INV-0005",
    "status": "draft",
    "subtotal": 330.00,
    "tax": 33.00,
    "total": 363.00,
    "dueDate": "2026-06-01T00:00:00.000Z"
  },
  "message": "Invoice created"
}
```

---

### GET `/invoices/:id`

Get a single invoice with linked ticket and estimate details.

---

### PATCH `/invoices/:id`

Update invoice `dueDate` or `notes`. Only editable in `draft` status.

---

### PATCH `/invoices/:id/issue`

Issue a draft invoice to the client. Changes status to `issued`.

**Status required:** `draft`

---

### POST `/invoices/from-estimate/:estimateId`

One-step conversion: create an invoice directly from an approved estimate.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `dueDate` | string (ISO 8601) | No |

**Business rules:** Estimate must be `approved`. Only one invoice per estimate is allowed.

**Errors:** `400` (not approved), `404`, `409` (invoice already exists for this estimate)

---

## 11. Endpoints — Payments

Base path: `/api/payments`  
**Auth required:** Yes  
**Roles:** `admin` (all endpoints)

---

### GET `/payments`

List all recorded payments with pagination.

**Query parameters:** `page`, `limit`

---

### POST `/payments`

Record a payment against an invoice.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoiceId` | string | Yes | Invoice to apply payment to |
| `amount` | number | Yes | Payment amount |
| `method` | string | Yes | e.g. `cash`, `bank_transfer`, `card` |
| `referenceNumber` | string | Yes | External payment reference |
| `paymentDate` | string (ISO 8601) | Yes | Date of payment |

**Example request:**
```json
{
  "invoiceId": "664c3b...",
  "amount": 363.00,
  "method": "bank_transfer",
  "referenceNumber": "TXN-20260505-001",
  "paymentDate": "2026-05-05T10:00:00.000Z"
}
```

**Business rules:**
- Invoice must not already be fully paid
- If payment covers the remaining balance → invoice status becomes `paid`
- If partial → invoice status becomes `partial`

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "invoiceId": { "invoiceNumber": "INV-0005", "total": 363.00 },
    "amount": 363.00,
    "method": "bank_transfer",
    "outstandingBalance": 0,
    "paymentDate": "2026-05-05T10:00:00.000Z"
  },
  "message": "Payment recorded"
}
```

---

### GET `/payments/:id`

Get a single payment record.

---

## 12. Endpoints — SLA Policies

Base path: `/api/sla`  
**Auth required:** Yes  
**Roles:** `admin` (all endpoints)

---

### GET `/sla`

List all SLA policies.

**Response — 200 OK:**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "priority": "critical", "resolutionTimeHours": 4, "name": "Critical SLA" },
    { "_id": "...", "priority": "high", "resolutionTimeHours": 8, "name": "High SLA" },
    { "_id": "...", "priority": "medium", "resolutionTimeHours": 24, "name": "Medium SLA" },
    { "_id": "...", "priority": "low", "resolutionTimeHours": 72, "name": "Low SLA" }
  ]
}
```

---

### POST `/sla`

Create a new SLA policy.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Policy display name |
| `priority` | string | Yes | `low`, `medium`, `high`, or `critical` |
| `resolutionTimeHours` | number | Yes | Hours allowed for resolution |

---

### PATCH `/sla/:id`

Update an existing SLA policy.

**Request body:** Same fields as POST (all optional).

---

### POST `/sla/trigger-sweep`

Manually trigger the SLA sweep job. Normally runs on a cron schedule — use this to force an immediate check of all open tickets for SLA breaches.

**Response — 200 OK:**
```json
{ "success": true, "message": "SLA sweep triggered" }
```

---

## 13. Endpoints — Dashboard

Base path: `/api/dashboard`  
**Auth required:** Yes

---

### GET `/dashboard/summary`

Admin dashboard summary — ticket counts by status, SLA breach count, recent activity.

**Roles:** `admin`

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 120,
    "byStatus": {
      "SUBMITTED": 12,
      "APPROVED": 8,
      "ASSIGNED": 15,
      "IN_PROGRESS": 20,
      "COMPLETED": 30,
      "CLOSED": 25,
      "REJECTED": 10
    },
    "slaBreached": 3,
    "openInvoices": 5
  }
}
```

---

### GET `/dashboard/technician`

Technician-focused dashboard — assigned tickets, workload, completion rate.

**Roles:** `admin`, `technician`

---

## 14. Endpoints — Analytics

Base path: `/api/analytics`  
**Auth required:** Yes  
**Roles:** `admin`

---

### GET `/analytics`

Return aggregated analytics data for the admin reporting view.

**Response data includes:** ticket volume over time, resolution rates, SLA compliance rates, technician performance metrics, category breakdowns.

---

## 15. Endpoints — Notifications

Base path: `/api/notifications`  
**Auth required:** Yes (any role — users see only their own notifications)

---

### GET `/notifications`

List all unread notifications for the authenticated user.

**Response — 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "ticket_status",
      "title": "Ticket status updated",
      "body": "TKT-0042 moved to IN PROGRESS",
      "ticketId": "...",
      "read": false,
      "createdAt": "2026-05-05T14:30:00.000Z"
    }
  ]
}
```

**Notification types:** `ticket_status`, `ticket_assigned`, `ticket_comment`

---

### PATCH `/notifications/read-all`

Mark all notifications for the authenticated user as read.

**Response — 200 OK:**
```json
{ "success": true, "message": "All notifications marked as read" }
```

---

## 16. Endpoints — AI Analysis

Base path: `/api/ai`  
**Auth required:** Yes (any role)

> **Note:** This endpoint is only active when `AI_ANALYSIS_ENABLED=true` and `ANTHROPIC_API_KEY` are set in `server/.env`. If not configured, the endpoint returns `400`.

---

### POST `/ai/analyze-image`

Analyze a maintenance issue image using Anthropic Claude and return structured diagnostic data.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64 data URI — format: `data:<mimetype>;base64,<data>` |

**Supported image types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Example request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}
```

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "category": "plumbing",
    "severity": "high",
    "issueType": "Leaking pipe joint",
    "description": "Visible water staining and active drip at copper pipe elbow joint.",
    "estimatedRepairTime": "1-2 hours",
    "requiredTools": ["pipe wrench", "PTFE tape", "solder kit"],
    "safetyPrecautions": ["Shut off water supply first", "Check for electrical proximity"],
    "confidence": 0.92,
    "analyzedAt": "2026-05-05T12:00:00.000Z"
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | `electrical`, `plumbing`, `hvac`, `structural`, `it`, or `other` |
| `severity` | string | `low`, `medium`, `high`, or `critical` |
| `issueType` | string | Short title of the detected issue (max 60 chars) |
| `description` | string | What Claude observed in the image (max 200 chars) |
| `estimatedRepairTime` | string | Human-readable time estimate |
| `requiredTools` | string[] | Up to 6 tool names |
| `safetyPrecautions` | string[] | Up to 3 safety notes |
| `confidence` | number | 0–1 confidence score. Values below 0.4 indicate the image may not show a maintenance issue |
| `analyzedAt` | string (ISO 8601) | Analysis timestamp |

**Errors:**
- `400` — AI analysis not enabled, missing `imageBase64`, invalid image format, or unsupported MIME type
- `500` — AI service misconfigured or returned unparseable response

---

## 17. Real-Time Events (Socket.io)

The server emits Socket.io events for real-time UI updates. Connect to `http://localhost:5000` with Socket.io client.

**Authentication:** Pass the JWT cookie in the Socket.io handshake. The server validates it and associates the socket with a user ID room.

| Event | Emitted When | Audience |
|-------|-------------|----------|
| `ticket_mutation` | Any ticket created, updated, assigned, or status changed | All connected clients (broadcast) |
| `ticket_status` | A ticket's status changes | Ticket submitter only |
| `ticket_assigned` | A ticket is assigned to a technician | Assigned technician only |
| `ticket_comment` | A comment is added to a ticket | The other party (submitter or technician) |

**Event payload example (`ticket_mutation`):**
```json
{ "action": "status_changed" }
```

**Event payload example (`ticket_assigned`):**
```json
{
  "type": "ticket_assigned",
  "title": "New ticket assigned to you",
  "body": "TKT-0042: Leaking pipe in Room 204",
  "ticketId": "664b2a..."
}
```

---

## 18. Feedback & Version Information

**Date:** May 2026  
**Version:** 1.0.0  
**Model used for AI analysis:** `claude-sonnet-4-6`

We value your feedback on both the API and this documentation. If you find missing endpoints, incorrect response shapes, or have suggestions, please open an issue or contact the team.

**Report issues:** https://github.com/SHRIKEN117/Fix-Flow/issues  
**Email:** shriken117@gmail.com

### Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | May 2026 | Initial API release — full MERN stack, role-based auth, ticket pipeline, estimates, invoices, payments, SLA, real-time Socket.io, AI image analysis |
