import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { SLABadge } from '@/components/sla/SLABadge';
import { useTickets } from '@/hooks/useTickets';
import { useAuthContext } from '@/context/AuthContext';
import { TicketStatus, Ticket, User } from '@/types';
import { formatDate } from '@/lib/utils';
import { STATUS_LABELS, CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const ALL_STATUSES: TicketStatus[] = [
  'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ASSIGNED',
  'IN_PROGRESS', 'ON_HOLD', 'PENDING_INSPECTION', 'INSPECTION_FAILED',
  'PENDING_ESTIMATE', 'ESTIMATE_APPROVED', 'PENDING_INVOICE', 'PAYMENT_PENDING', 'CLOSED',
];

const ALL_SENTINEL = '__all__';

export function TicketListPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  // Internal Select state uses '__all__' as the "no filter" sentinel because
  // Radix UI Select v2 throws an error when SelectItem has value=""
  const [statusFilter, setStatusFilter] = useState<string>(ALL_SENTINEL);
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL_SENTINEL);

  const activeStatus = statusFilter === ALL_SENTINEL ? undefined : statusFilter as TicketStatus;
  const activePriority = priorityFilter === ALL_SENTINEL ? undefined : priorityFilter;

  const { data, isLoading } = useTickets({
    status: activeStatus,
    priority: activePriority,
    limit: 50,
  });

  const canCreate = user?.role !== 'finance';

  return (
    <div className="space-y-6">
      <PageHeader
        title={user?.role === 'user' ? 'My Tickets' : 'All Tickets'}
        subtitle={`${data?.total ?? 0} total tickets`}
        action={
          canCreate ? (
            <Button onClick={() => navigate('/tickets/new')} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Ticket
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>All Statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== ALL_SENTINEL || priorityFilter !== ALL_SENTINEL) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter(ALL_SENTINEL); setPriorityFilter(ALL_SENTINEL); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-white">
          <Filter className="h-10 w-10 text-fixflow-muted mb-3" />
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs text-fixflow-muted mt-1">
            {canCreate ? 'Create your first ticket to get started.' : 'No tickets match your filters.'}
          </p>
          {canCreate && (
            <Button
              className="mt-4 gap-2"
              onClick={() => navigate('/tickets/new')}
            >
              <PlusCircle className="h-4 w-4" />
              New Ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Ticket #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-28">Category</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-24">SLA</TableHead>
                <TableHead className="w-32">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((ticket: Ticket) => {
                const isBreached = ticket.slaStatus === 'breached';
                return (
                  <TableRow
                    key={ticket._id}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50',
                      isBreached && 'border-l-4 border-l-red-500'
                    )}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    <TableCell className="font-mono text-xs text-fixflow-muted">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm truncate max-w-xs">{ticket.title}</p>
                        <p className="text-xs text-fixflow-muted">{ticket.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </TableCell>
                    <TableCell>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <TicketStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <SLABadge status={ticket.slaStatus} />
                    </TableCell>
                    <TableCell className="text-xs text-fixflow-muted">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
