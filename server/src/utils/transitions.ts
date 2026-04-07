import { TicketStatus } from '../models/Ticket.model';
import { UserRole } from '../models/User.model';

interface TransitionRule {
  to: TicketStatus[];
  roles: UserRole[];
}

type TransitionMap = Partial<Record<TicketStatus, TransitionRule[]>>;

export const TRANSITION_MAP: TransitionMap = {
  SUBMITTED: [
    { to: ['UNDER_REVIEW'], roles: ['admin'] },
    { to: ['REJECTED'], roles: ['admin'] },
  ],
  UNDER_REVIEW: [
    { to: ['APPROVED'], roles: ['admin'] },
    { to: ['REJECTED'], roles: ['admin'] },
  ],
  APPROVED: [
    { to: ['ASSIGNED'], roles: ['admin'] },
  ],
  ASSIGNED: [
    { to: ['IN_PROGRESS'], roles: ['technician'] },
  ],
  IN_PROGRESS: [
    { to: ['ON_HOLD'], roles: ['technician', 'admin'] },
    { to: ['PENDING_INSPECTION'], roles: ['technician'] },
  ],
  ON_HOLD: [
    { to: ['IN_PROGRESS'], roles: ['technician', 'admin'] },
  ],
  PENDING_INSPECTION: [
    { to: ['INSPECTION_FAILED'], roles: ['admin'] },
    { to: ['PENDING_ESTIMATE'], roles: ['admin'] },
  ],
  INSPECTION_FAILED: [
    { to: ['IN_PROGRESS'], roles: ['technician'] },
  ],
  PENDING_ESTIMATE: [
    { to: ['ESTIMATE_APPROVED'], roles: ['finance', 'admin'] },
  ],
  ESTIMATE_APPROVED: [
    { to: ['PENDING_INVOICE'], roles: ['finance'] },
  ],
  PENDING_INVOICE: [
    { to: ['PAYMENT_PENDING'], roles: ['finance'] },
  ],
  PAYMENT_PENDING: [
    { to: ['CLOSED'], roles: ['admin', 'finance'] },
  ],
};

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateTransition(
  fromStatus: TicketStatus,
  toStatus: TicketStatus,
  role: UserRole
): TransitionValidationResult {
  const rules = TRANSITION_MAP[fromStatus];

  if (!rules || rules.length === 0) {
    return { valid: false, reason: `No transitions allowed from status '${fromStatus}'` };
  }

  const matchingRule = rules.find((rule) => rule.to.includes(toStatus));

  if (!matchingRule) {
    return {
      valid: false,
      reason: `Transition from '${fromStatus}' to '${toStatus}' is not allowed`,
    };
  }

  if (!matchingRule.roles.includes(role)) {
    return {
      valid: false,
      reason: `Role '${role}' is not authorized to transition from '${fromStatus}' to '${toStatus}'`,
    };
  }

  return { valid: true };
}

export function getValidTransitions(
  fromStatus: TicketStatus,
  role: UserRole
): TicketStatus[] {
  const rules = TRANSITION_MAP[fromStatus];
  if (!rules) return [];

  return rules
    .filter((rule) => rule.roles.includes(role))
    .flatMap((rule) => rule.to);
}
