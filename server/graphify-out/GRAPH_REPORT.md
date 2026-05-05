# Graph Report - FixFlow Server  (2026-05-05)

## Summary
- 169 nodes · 230 edges · 36 communities (35 shown, 1 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output (code-only corpus — AST extraction, no LLM calls)

## Graph Freshness
- Built from commit: `2e750caf`
- Run `git rev-parse HEAD` to check if stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0 → **Estimate Workflow** (16 nodes)
- Community 1 → **Ticket Operations** (13 nodes)
- Community 2 → **Auth & User Management**
- Community 3 → **Request Middleware** (3 nodes)
- Community 4 → **Email Notifications** (16 nodes)
- Community 6 → **App Bootstrap & Config** (5 nodes)
- Community 7 → **SLA Management** (3 nodes)

## God Nodes (most connected — your core abstractions)
1. `createAuditEntry()` — 23 edges
2. `ApiError` — 22 edges
3. `sendTicketUpdateEmail()` — 13 edges
4. `authenticate()` — 12 edges
5. `authorize()` — 9 edges
6. `generateAutoNumber()` — 8 edges
7. `validateBody()` — 7 edges
8. `sendTicketCreatedEmail()` — 7 edges
9. `updateTicketStatus()` — 7 edges
10. `sweepAllTickets()` — 6 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --calls--> `initSocketServer()`  [INFERRED]
  src/index.ts → src/services/socket.service.ts
- `deleteTicket()` --calls--> `createAuditEntry()`  [INFERRED]
  src/controllers/ticket.controller.ts → src/utils/auditLog.ts
- `setPriority()` --calls--> `createAuditEntry()`  [INFERRED]
  src/controllers/ticket.controller.ts → src/utils/auditLog.ts
- `uploadAttachment()` --calls--> `createAuditEntry()`  [INFERRED]
  src/controllers/ticket.controller.ts → src/utils/auditLog.ts
- `createTicket()` --calls--> `generateAutoNumber()`  [INFERRED]
  src/controllers/ticket.controller.ts → src/utils/autoNumber.ts

## Communities (36 total, 1 thin omitted)

### Community 0 — Estimate Workflow
Cohesion: 0.12
Nodes (16): addEstimateItem(), approveEstimate(), calcTotals(), createEstimate(), deleteEstimateItem(), rejectEstimate(), requestRevision(), submitEstimate() (+8 more: getEstimate, listEstimates, updateEstimate, updateEstimateItem, convertToInvoice, getInvoice, listInvoices, updateInvoice)

### Community 1 — Ticket Operations
Cohesion: 0.12
Nodes (13): addComment(), assignTicket(), createTicket(), deleteTicket(), getTicket(), setPriority(), updateTicketStatus(), uploadAttachment() (+5 more: listTickets, getMyTickets, deleteComment, deleteAttachment, getAttachment)

### Community 2 — Auth & User Management
Nodes: login(), register(), refreshToken(), getProfile(), updateProfile(), listUsers(), getUser(), updateUser(), createTechnician(), updateTechnician(), listTechnicians(), getTechnician()

### Community 3 — Request Middleware
Cohesion: 0.21
Nodes (3): authenticate(), authorize(), validateBody()

### Community 4 — Email Notifications
Cohesion: 0.28
Nodes (16): badge(), baseTemplate(), divider(), estimateSection(), fetchLatestEstimate(), fetchTechnicianInfo(), fmt(), priorityColor() (+8 more: sendTicketCreatedEmail, sendTicketUpdateEmail, sendEstimateEmail, sendInvoiceEmail, ticketSection, technicianSection, statusBadge, emailLayout)

### Community 6 — App Bootstrap & Config
Cohesion: 0.31
Nodes (5): connectDB(), startSLACronJob(), errorHandler(), bootstrap(), verifySmtp()

### Community 7 — SLA Management
Cohesion: 0.28
Nodes (3): triggerSweep(), computeSLAStatus(), sweepAllTickets()

### Community 8 — Dashboard Analytics
Nodes: getDashboardStats(), getAdminStats(), getTechnicianStats()

### Community 9 — Notifications
Nodes: createNotification(), getNotifications(), markRead()

### Remaining communities (10–35) — utility/model nodes
- Audit Log, Auto Numbering, Environment Config, Seed Data, API Entry Point, Error Types, Mongoose Models (Ticket, Estimate, Invoice, SLA, User, Notification, Feedback, Technician), Attachment Handler, Route Definitions, Transition Utilities, AI Controller, Validation Schemas, Response Helpers, Analytics Controller, Socket Service, Feedback Controller

## Knowledge Gaps
- **1 thin community (<3 nodes) omitted** — run `graphify query` to explore isolated nodes.

## Suggested Questions

- **Why does `ApiError` bridge Estimate Workflow, Ticket Operations, Request Middleware, and App Bootstrap?**
  _Betweenness centrality 0.397 — removing it would disconnect major clusters._
- **Why does `createAuditEntry()` bridge Estimate Workflow, Ticket Operations, and SLA Management?**
  _Betweenness centrality 0.098 — 17 INFERRED edges worth verifying._
- **Why does `sendTicketUpdateEmail()` bridge Email Notifications and Ticket Operations?**
  _Betweenness centrality 0.094 — only 2 INFERRED edges, likely correct._
- **Are the 17 inferred `createAuditEntry()` call edges correct?** (with `sweepAllTickets()`, `createTicket()`, `deleteTicket()`, etc.)
- **Should Estimate Workflow (Community 0, cohesion 0.12) be split?**
  _Low cohesion suggests estimate + invoice controllers may belong in separate modules._
- **Should Ticket Operations (Community 1, cohesion 0.12) be split?**
  _Low cohesion — ticket CRUD vs. ticket state machine vs. comments/attachments._

## How to explore further

```bash
# Navigate from any function to its neighbors
graphify explain "createAuditEntry()"

# Shortest path between two concepts
graphify path "createTicket()" "sendTicketCreatedEmail()"

# Ask the graph a question
graphify query "what happens when a ticket is created?"
graphify query "which functions are involved in SLA breach detection?"
```

Open `graphify-out/graph.html` in a browser for the interactive visualization.
