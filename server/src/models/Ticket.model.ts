import mongoose, { Document, Schema } from 'mongoose';

export type TicketStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'PENDING_INSPECTION'
  | 'INSPECTION_FAILED'
  | 'PENDING_ESTIMATE'
  | 'ESTIMATE_APPROVED'
  | 'PENDING_INVOICE'
  | 'PAYMENT_PENDING'
  | 'CLOSED';

export type TicketCategory = 'electrical' | 'plumbing' | 'hvac' | 'structural' | 'it' | 'other';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  location: string;
  status: TicketStatus;
  submittedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  slaPolicy?: mongoose.Types.ObjectId;
  slaDeadline?: Date;
  slaStatus: SLAStatus;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ALL_STATUSES: TicketStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'PENDING_INSPECTION',
  'INSPECTION_FAILED',
  'PENDING_ESTIMATE',
  'ESTIMATE_APPROVED',
  'PENDING_INVOICE',
  'PAYMENT_PENDING',
  'CLOSED',
];

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['electrical', 'plumbing', 'hvac', 'structural', 'it', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ALL_STATUSES,
      default: 'SUBMITTED',
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    slaPolicy: { type: Schema.Types.ObjectId, ref: 'SLAPolicy' },
    slaDeadline: { type: Date },
    slaStatus: {
      type: String,
      enum: ['on_track', 'at_risk', 'breached'],
      default: 'on_track',
    },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ submittedBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ slaStatus: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
