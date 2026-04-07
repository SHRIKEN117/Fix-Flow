import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, TicketFilters } from '@/api/tickets.api';
import { TicketStatus } from '@/types';
import { CreateTicketFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketsApi.list(filters),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketFormData) => ticketsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
    },
    onError: () => toast.error('Failed to create ticket'),
  });
}

export function useUpdateTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, reason }: { status: TicketStatus; reason?: string }) =>
      ticketsApi.updateStatus(ticketId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Status updated');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to update status'),
  });
}

export function useAssignTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (technicianId: string) => ticketsApi.assign(ticketId, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Technician assigned');
    },
    onError: () => toast.error('Failed to assign technician'),
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'comments'],
    queryFn: () => ticketsApi.listComments(ticketId),
    enabled: !!ticketId,
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => ticketsApi.addComment(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'comments'] });
    },
    onError: () => toast.error('Failed to add comment'),
  });
}

export function useDeleteComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => ticketsApi.deleteComment(ticketId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'comments'] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });
}

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'attachments'],
    queryFn: () => ticketsApi.listAttachments(ticketId),
    enabled: !!ticketId,
  });
}

export function useUploadAttachment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => ticketsApi.uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'attachments'] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Failed to upload file'),
  });
}

export function useDeleteAttachment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => ticketsApi.deleteAttachment(ticketId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'attachments'] });
      toast.success('Attachment deleted');
    },
    onError: () => toast.error('Failed to delete attachment'),
  });
}

export function useTicketAudit(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'audit'],
    queryFn: () => ticketsApi.getAuditLog(ticketId),
    enabled: !!ticketId,
  });
}
