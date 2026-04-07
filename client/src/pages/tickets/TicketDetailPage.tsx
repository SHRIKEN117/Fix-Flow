import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { StatusTransitionModal } from '@/components/tickets/StatusTransitionModal';
import { AssignTechnicianModal } from '@/components/tickets/AssignTechnicianModal';
import { CommentThread } from '@/components/tickets/CommentThread';
import { AttachmentUpload } from '@/components/tickets/AttachmentUpload';
import { SLABadge } from '@/components/sla/SLABadge';
import { SLACountdown } from '@/components/sla/SLACountdown';
import {
  useTicket,
  useUpdateTicketStatus,
  useAssignTicket,
  useTicketComments,
  useAddComment,
  useDeleteComment,
  useTicketAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useTicketAudit,
} from '@/hooks/useTickets';
import { useAuthContext } from '@/context/AuthContext';
import { usersApi } from '@/api/users.api';
import { useQuery } from '@tanstack/react-query';
import { Ticket, TicketStatus, User } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CATEGORY_LABELS as CAT_LABELS } from '@/lib/constants';
import { toast } from 'sonner';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { data: ticketData, isLoading } = useTicket(id!);
  const { data: commentsData } = useTicketComments(id!);
  const { data: attachmentsData } = useTicketAttachments(id!);
  const { data: auditData } = useTicketAudit(id!);
  const { data: techniciansData, isLoading: techLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersApi.listTechnicians(),
    enabled: assignModalOpen,
  });

  const updateStatus = useUpdateTicketStatus(id!);
  const assignTicket = useAssignTicket(id!);
  const addComment = useAddComment(id!);
  const deleteComment = useDeleteComment(id!);
  const uploadAttachment = useUploadAttachment(id!);
  const deleteAttachment = useDeleteAttachment(id!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const ticket = ticketData?.data as Ticket & { validTransitions?: TicketStatus[] };
  if (!ticket) return <div className="text-sm text-fixflow-muted">Ticket not found.</div>;

  const submittedBy = typeof ticket.submittedBy === 'object' ? ticket.submittedBy as User : null;
  const assignedTo = typeof ticket.assignedTo === 'object' ? ticket.assignedTo as User : null;

  const validTransitions = ticket.validTransitions ?? [];
  const canUpdateStatus = validTransitions.length > 0;
  const canAssign = user?.role === 'admin' && ticket.status === 'APPROVED';

  const handleStatusUpdate = async (status: TicketStatus, reason?: string) => {
    await updateStatus.mutateAsync({ status, reason });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        subtitle={ticket.ticketNumber}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-fixflow-muted uppercase tracking-wide">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Tabs: Timeline, Comments, Attachments */}
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              {user?.role === 'admin' && (
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <CommentThread
                    comments={commentsData?.data ?? []}
                    currentUser={user!}
                    onAdd={(body) => addComment.mutateAsync(body).then(() => {})}
                    onDelete={(commentId) => deleteComment.mutateAsync(commentId).then(() => {})}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <AttachmentUpload
                    attachments={attachmentsData?.data ?? []}
                    currentUser={user!}
                    onUpload={(file) => uploadAttachment.mutateAsync(file).then(() => {})}
                    onDelete={(attId) => deleteAttachment.mutateAsync(attId).then(() => {})}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {user?.role === 'admin' && (
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <TicketTimeline logs={auditData?.data ?? []} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-fixflow-muted uppercase tracking-wide">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TicketStatusBadge status={ticket.status} />

              <div className="space-y-2">
                <SLABadge status={ticket.slaStatus} />
                <SLACountdown deadline={ticket.slaDeadline} slaStatus={ticket.slaStatus} />
              </div>

              <Separator />

              <div className="space-y-2">
                {canUpdateStatus && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => setStatusModalOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Update Status
                  </Button>
                )}
                {canAssign && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setAssignModalOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Assign Technician
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-fixflow-muted uppercase tracking-wide">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Priority</span>
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Category</span>
                <span className="capitalize">{CAT_LABELS[ticket.category]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Location</span>
                <span className="text-right max-w-[150px] truncate">{ticket.location}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Submitted by</span>
                <span>{submittedBy?.name ?? '—'}</span>
              </div>
              {assignedTo && (
                <div className="flex justify-between">
                  <span className="text-fixflow-muted">Assigned to</span>
                  <span>{assignedTo.name}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Created</span>
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.closedAt && (
                <div className="flex justify-between">
                  <span className="text-fixflow-muted">Closed</span>
                  <span>{formatDate(ticket.closedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <StatusTransitionModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={handleStatusUpdate}
        validTransitions={validTransitions}
        currentStatus={ticket.status}
      />

      <AssignTechnicianModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={(techId) => assignTicket.mutateAsync(techId).then(() => {})}
        technicians={techniciansData?.data ?? []}
        isLoading={techLoading}
      />
    </div>
  );
}
