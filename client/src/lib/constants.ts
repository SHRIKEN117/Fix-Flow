import { TicketStatus, TicketPriority, SLAStatus } from '@/types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  PENDING_INSPECTION: 'Pending Inspection',
  INSPECTION_FAILED: 'Inspection Failed',
  PENDING_ESTIMATE: 'Pending Estimate',
  ESTIMATE_APPROVED: 'Estimate Approved',
  PENDING_INVOICE: 'Pending Invoice',
  PAYMENT_PENDING: 'Payment Pending',
  CLOSED: 'Closed',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  ASSIGNED: 'bg-violet-100 text-violet-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  ON_HOLD: 'bg-orange-100 text-orange-700',
  PENDING_INSPECTION: 'bg-cyan-100 text-cyan-700',
  INSPECTION_FAILED: 'bg-rose-100 text-rose-700',
  PENDING_ESTIMATE: 'bg-yellow-100 text-yellow-700',
  ESTIMATE_APPROVED: 'bg-teal-100 text-teal-700',
  PENDING_INVOICE: 'bg-indigo-100 text-indigo-700',
  PAYMENT_PENDING: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-green-100 text-green-700',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-400 text-yellow-900',
  low: 'bg-slate-200 text-slate-600',
};

export const SLA_COLORS: Record<SLAStatus, string> = {
  on_track: 'text-green-600',
  at_risk: 'text-amber-600',
  breached: 'text-red-600',
};

export const CATEGORY_LABELS: Record<string, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  structural: 'Structural',
  it: 'IT',
  other: 'Other',
};

export const ESTIMATE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  card: 'Card',
  cheque: 'Cheque',
};
