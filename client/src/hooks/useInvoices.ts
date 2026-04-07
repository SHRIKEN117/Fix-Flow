import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices.api';
import { CreateInvoiceFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function useInvoices(page = 1) {
  return useQuery({
    queryKey: ['invoices', page],
    queryFn: () => invoicesApi.list(page),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceFormData) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
    },
    onError: () => toast.error('Failed to create invoice'),
  });
}

export function useIssueInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invoicesApi.issue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
      toast.success('Invoice issued');
    },
    onError: () => toast.error('Failed to issue invoice'),
  });
}
