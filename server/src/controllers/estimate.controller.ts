import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Estimate } from '../models/Estimate.model';
import { EstimateItem } from '../models/EstimateItem.model';
import { Ticket } from '../models/Ticket.model';
import { generateAutoNumber } from '../utils/autoNumber';
import { createAuditEntry } from '../utils/auditLog';
import { ApiError } from '../utils/ApiError';

function calcTotals(items: Array<{ quantity: number; unitPrice: number; lineTotal: number }>, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export async function listEstimates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;

    const [estimates, total] = await Promise.all([
      Estimate.find()
        .populate('ticketId', 'ticketNumber title priority')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Estimate.countDocuments(),
    ]);

    res.json({ success: true, data: estimates, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function createEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId, items, notes, taxRate = 0 } = req.body as {
      ticketId: string;
      items: Array<{ type: string; description: string; quantity: number; unitPrice: number }>;
      notes?: string;
      taxRate?: number;
    };

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const estimateNumber = await generateAutoNumber('EST');

    const lineItems = items.map((item) => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const { subtotal, tax, total } = calcTotals(lineItems, taxRate);

    const estimate = await Estimate.create({
      estimateNumber,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      createdBy: new mongoose.Types.ObjectId(req.user!.userId),
      subtotal,
      tax,
      total,
      notes,
    });

    await EstimateItem.insertMany(
      lineItems.map((item) => ({ ...item, estimateId: estimate._id }))
    );

    await createAuditEntry({
      ticketId: new mongoose.Types.ObjectId(ticketId),
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'ESTIMATE_CREATED',
      metadata: { estimateNumber, total },
    });

    const populated = await Estimate.findById(estimate._id)
      .populate('ticketId', 'ticketNumber title')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated, message: 'Estimate created' });
  } catch (error) {
    next(error);
  }
}

export async function getEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id'])
      .populate('ticketId', 'ticketNumber title priority status')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!estimate) throw ApiError.notFound('Estimate not found');

    const items = await EstimateItem.find({ estimateId: estimate._id });

    res.json({ success: true, data: { ...estimate.toObject(), items } });
  } catch (error) {
    next(error);
  }
}

export async function updateEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft') throw ApiError.badRequest('Only draft estimates can be updated');

    const { notes, taxRate } = req.body as { notes?: string; taxRate?: number };

    if (taxRate !== undefined) {
      const items = await EstimateItem.find({ estimateId: estimate._id }).lean();
      const { subtotal, tax, total } = calcTotals(items, taxRate);
      estimate.subtotal = subtotal;
      estimate.tax = tax;
      estimate.total = total;
    }

    if (notes !== undefined) estimate.notes = notes;
    await estimate.save();

    res.json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
}

export async function addEstimateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft') throw ApiError.badRequest('Only draft estimates can be modified');

    const { type, description, quantity, unitPrice } = req.body as {
      type: string;
      description: string;
      quantity: number;
      unitPrice: number;
    };

    const lineTotal = quantity * unitPrice;
    const item = await EstimateItem.create({
      estimateId: estimate._id,
      type,
      description,
      quantity,
      unitPrice,
      lineTotal,
    });

    const allItems = await EstimateItem.find({ estimateId: estimate._id }).lean();
    const { subtotal, tax, total } = calcTotals(
      allItems,
      estimate.tax > 0 ? (estimate.tax / estimate.subtotal) * 100 : 0
    );

    estimate.subtotal = subtotal;
    estimate.tax = tax;
    estimate.total = total;
    await estimate.save();

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteEstimateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft') throw ApiError.badRequest('Only draft estimates can be modified');

    const item = await EstimateItem.findOneAndDelete({
      _id: req.params['itemId'],
      estimateId: estimate._id,
    });

    if (!item) throw ApiError.notFound('Item not found');

    const allItems = await EstimateItem.find({ estimateId: estimate._id }).lean();
    const { subtotal, tax, total } = calcTotals(
      allItems,
      estimate.subtotal > 0 ? (estimate.tax / estimate.subtotal) * 100 : 0
    );

    estimate.subtotal = subtotal;
    estimate.tax = tax;
    estimate.total = total;
    await estimate.save();

    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    next(error);
  }
}

export async function approveEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'submitted' && estimate.status !== 'draft') {
      throw ApiError.badRequest('Estimate cannot be approved in its current state');
    }

    estimate.status = 'approved';
    estimate.approvedBy = new mongoose.Types.ObjectId(req.user!.userId);
    estimate.approvedAt = new Date();
    await estimate.save();

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'ESTIMATE_APPROVED',
      metadata: { estimateId: estimate._id, total: estimate.total },
    });

    res.json({ success: true, data: estimate, message: 'Estimate approved' });
  } catch (error) {
    next(error);
  }
}

export async function rejectEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');

    estimate.status = 'rejected';
    await estimate.save();

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'ESTIMATE_REJECTED',
      metadata: { estimateId: estimate._id, reason: req.body.reason },
    });

    res.json({ success: true, data: estimate, message: 'Estimate rejected' });
  } catch (error) {
    next(error);
  }
}
