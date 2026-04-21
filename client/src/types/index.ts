// ─── Core ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'technician' | 'user';
export type TechnicianAvailability = 'available' | 'busy' | 'off';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianProfile {
  _id: string;
  userId: User | string;
  specialization: string;
  currentWorkload: number;
  availability: TechnicianAvailability;
  createdAt: string;
  updatedAt: string;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED';

export interface NextAction {
  to: TicketStatus;
  label: string;
  variant: 'default' | 'destructive' | 'outline';
}

export type TicketCategory = 'electrical' | 'plumbing' | 'hvac' | 'structural' | 'it' | 'other';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

export interface Ticket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  customCategory?: string;
  priority: TicketPriority;
  location: string;
  imageBase64?: string;
  status: TicketStatus;
  submittedBy: User | string;
  assignedTo?: User | string;
  slaPolicy?: SLAPolicy | string;
  slaDeadline?: string;
  slaStatus: SLAStatus;
  closedAt?: string;
  nextActions?: NextAction[];
  pipelineStages?: TicketStatus[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  _id: string;
  ticketId: string;
  authorId: User | string;
  body: string;
  createdAt: string;
}

export interface TicketAttachment {
  _id: string;
  ticketId: string;
  uploadedBy: User | string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  storagePath: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  ticketId: string;
  actorId: User | string;
  action: string;
  fromValue?: string;
  toValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── SLA ─────────────────────────────────────────────────────────────────────

export interface SLAPolicy {
  _id: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  createdBy: User | string;
  updatedAt: string;
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type EstimateStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type EstimateItemType = 'labor' | 'parts' | 'overhead';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'cheque';

export interface EstimateItem {
  _id: string;
  estimateId: string;
  type: EstimateItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Estimate {
  _id: string;
  estimateNumber: string;
  ticketId: Ticket | string;
  createdBy: User | string;
  status: EstimateStatus;
  approvedBy?: User | string;
  approvedAt?: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items?: EstimateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  ticketId: Ticket | string;
  estimateId?: Estimate | string;
  createdBy: User | string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  invoiceId: Invoice | string;
  recordedBy: User | string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  outstandingBalance: number;
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  breachedTickets: number;
  totalUsers: number;
  recentTickets: number;
  ticketTrend: number;
  totalRevenue: number;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  slaDistribution: Record<string, number>;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface CreateTicketForm {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  location: string;
}

export interface CreateEstimateForm {
  ticketId: string;
  items: Array<{
    type: EstimateItemType;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  taxRate?: number;
}
