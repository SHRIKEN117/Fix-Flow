import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket, TicketStatus } from '../models/Ticket.model';
import { User } from '../models/User.model';
import { Technician } from '../models/Technician.model';
import { SLAPolicy } from '../models/SLAPolicy.model';
import { AuditLog } from '../models/AuditLog.model';
import { TicketComment } from '../models/TicketComment.model';
import { TicketAttachment } from '../models/TicketAttachment.model';
import { generateAutoNumber } from '../utils/autoNumber';
import { createAuditEntry } from '../utils/auditLog';
import { validateTransition, getValidTransitions } from '../utils/transitions';
import { computeSLAStatus } from '../utils/slaEngine';
import { ApiError } from '../utils/ApiError';

export async function listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;

    const { status, priority, category, slaStatus } = req.query as Record<string, string>;

    let filter: Record<string, unknown> = {};

    if (role === 'technician') {
      const techUser = await User.findById(userId);
      filter['assignedTo'] = techUser?._id;
    } else if (role === 'user') {
      filter['submittedBy'] = new mongoose.Types.ObjectId(userId);
    }
    // admin and finance see all

    if (status) filter['status'] = status;
    if (priority) filter['priority'] = priority;
    if (category) filter['category'] = category;
    if (slaStatus) filter['slaStatus'] = slaStatus;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('submittedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('slaPolicy', 'priority resolutionTimeHours')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, category, priority, location } = req.body as {
      title: string;
      description: string;
      category: string;
      priority: string;
      location: string;
    };

    const ticketNumber = await generateAutoNumber('TKT');

    const slaPolicy = await SLAPolicy.findOne({ priority });

    let slaDeadline: Date | undefined;
    if (slaPolicy) {
      slaDeadline = new Date(Date.now() + slaPolicy.resolutionTimeHours * 3_600_000);
    }

    const ticket = await Ticket.create({
      ticketNumber,
      title,
      description,
      category,
      priority,
      location,
      submittedBy: new mongoose.Types.ObjectId(req.user!.userId),
      slaPolicy: slaPolicy?._id,
      slaDeadline,
    });

    await createAuditEntry({
      ticketId: ticket._id,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'TICKET_CREATED',
      toValue: 'SUBMITTED',
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('submittedBy', 'name email')
      .populate('slaPolicy', 'priority resolutionTimeHours');

    res.status(201).json({ success: true, data: populated, message: 'Ticket created' });
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const ticket = await Ticket.findById(req.params['id'])
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('slaPolicy');

    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (
      role === 'user' &&
      ticket.submittedBy._id.toString() !== userId
    ) {
      throw ApiError.forbidden('Access denied');
    }

    if (
      role === 'technician' &&
      ticket.assignedTo?._id.toString() !== userId
    ) {
      throw ApiError.forbidden('Access denied');
    }

    const validTransitions = getValidTransitions(ticket.status, role as any);

    res.json({ success: true, data: { ...ticket.toObject(), validTransitions } });
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params['id'],
      req.body,
      { new: true, runValidators: true }
    ).populate('submittedBy', 'name email');

    if (!ticket) throw ApiError.notFound('Ticket not found');

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
}

export async function updateTicketStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status: newStatus, reason } = req.body as { status: TicketStatus; reason?: string };
    const { role, userId } = req.user!;

    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const validation = validateTransition(ticket.status, newStatus, role as any);
    if (!validation.valid) {
      throw ApiError.badRequest(validation.reason ?? 'Invalid transition');
    }

    const fromStatus = ticket.status;
    ticket.status = newStatus;

    if (newStatus === 'CLOSED') {
      ticket.closedAt = new Date();
    }

    if (ticket.slaPolicy) {
      const policy = await SLAPolicy.findById(ticket.slaPolicy);
      if (policy) {
        ticket.slaStatus = computeSLAStatus(ticket, policy);
      }
    }

    await ticket.save();

    await createAuditEntry({
      ticketId: ticket._id,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'STATUS_CHANGED',
      fromValue: fromStatus,
      toValue: newStatus,
      metadata: reason ? { reason } : undefined,
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('slaPolicy');

    res.json({ success: true, data: populated, message: `Status updated to ${newStatus}` });
  } catch (error) {
    next(error);
  }
}

export async function assignTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { technicianId } = req.body as { technicianId: string };
    const { userId } = req.user!;

    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (ticket.status !== 'APPROVED') {
      throw ApiError.badRequest('Ticket must be APPROVED before assigning a technician');
    }

    const techUser = await User.findById(technicianId);
    if (!techUser || techUser.role !== 'technician') {
      throw ApiError.badRequest('Invalid technician');
    }

    const prevAssignedTo = ticket.assignedTo;
    ticket.assignedTo = techUser._id;
    ticket.status = 'ASSIGNED';
    await ticket.save();

    // Update technician workload
    if (prevAssignedTo) {
      await Technician.findOneAndUpdate(
        { userId: prevAssignedTo },
        { $inc: { currentWorkload: -1 } }
      );
    }
    await Technician.findOneAndUpdate(
      { userId: techUser._id },
      { $inc: { currentWorkload: 1 }, availability: 'busy' }
    );

    await createAuditEntry({
      ticketId: ticket._id,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'ASSIGNED',
      fromValue: prevAssignedTo?.toString(),
      toValue: technicianId,
      metadata: { technicianName: techUser.name },
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: populated, message: 'Technician assigned' });
  } catch (error) {
    next(error);
  }
}

export async function listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const comments = await TicketComment.find({ ticketId: ticket._id })
      .populate('authorId', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = req.body as { body: string };
    const { userId } = req.user!;

    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const comment = await TicketComment.create({
      ticketId: ticket._id,
      authorId: new mongoose.Types.ObjectId(userId),
      body,
    });

    await createAuditEntry({
      ticketId: ticket._id,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'COMMENT_ADDED',
    });

    const populated = await TicketComment.findById(comment._id).populate(
      'authorId',
      'name email role'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const comment = await TicketComment.findById(req.params['commentId']);
    if (!comment) throw ApiError.notFound('Comment not found');

    if (comment.authorId.toString() !== userId && role !== 'admin') {
      throw ApiError.forbidden('Cannot delete another user\'s comment');
    }

    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
}

export async function listAttachments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const attachments = await TicketAttachment.find({ ticketId: ticket._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: attachments });
  } catch (error) {
    next(error);
  }
}

export async function uploadAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.user!;
    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (!req.file) throw ApiError.badRequest('No file uploaded');

    const attachment = await TicketAttachment.create({
      ticketId: ticket._id,
      uploadedBy: new mongoose.Types.ObjectId(userId),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
    });

    await createAuditEntry({
      ticketId: ticket._id,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'ATTACHMENT_ADDED',
      metadata: { filename: req.file.originalname },
    });

    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const attachment = await TicketAttachment.findById(req.params['attachmentId']);
    if (!attachment) throw ApiError.notFound('Attachment not found');

    if (attachment.uploadedBy.toString() !== userId && role !== 'admin') {
      throw ApiError.forbidden('Cannot delete another user\'s attachment');
    }

    await attachment.deleteOne();
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getTicketAudit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ticket = await Ticket.findById(req.params['id']);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const logs = await AuditLog.find({ ticketId: ticket._id })
      .populate('actorId', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}
