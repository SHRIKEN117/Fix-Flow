import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'technician', 'user', 'finance']).default('user'),
  phone: z.string().optional(),
  department: z.string().optional(),
});

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum(['electrical', 'plumbing', 'hvac', 'structural', 'it', 'other']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  location: z.string().min(2, 'Location is required').max(200),
});

export const updateStatusSchema = z.object({
  status: z.enum([
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
  ]),
  reason: z.string().max(500).optional(),
});

export const estimateItemSchema = z.object({
  type: z.enum(['labor', 'parts', 'overhead']),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

export const createEstimateSchema = z.object({
  ticketId: z.string().min(1),
  items: z.array(estimateItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(2000).optional(),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  ticketId: z.string().min(1),
  estimateId: z.string().optional(),
  dueDate: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['bank_transfer', 'cash', 'card', 'cheque']),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
});

export const createSLAPolicySchema = z.object({
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  responseTimeHours: z.number().min(1, 'Response time must be at least 1 hour'),
  resolutionTimeHours: z.number().min(1, 'Resolution time must be at least 1 hour'),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(2000),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
export type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;
export type CreateEstimateFormData = z.infer<typeof createEstimateSchema>;
export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
export type CreateSLAPolicyFormData = z.infer<typeof createSLAPolicySchema>;
export type AddCommentFormData = z.infer<typeof addCommentSchema>;
