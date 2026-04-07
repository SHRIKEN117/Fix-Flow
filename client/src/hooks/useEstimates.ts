import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estimatesApi } from '@/api/estimates.api';
import { CreateEstimateFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function useEstimates(page = 1) {
  return useQuery({
    queryKey: ['estimates', page],
    queryFn: () => estimatesApi.list(page),
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ['estimates', id],
    queryFn: () => estimatesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEstimateFormData) => estimatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created');
    },
    onError: () => toast.error('Failed to create estimate'),
  });
}

export function useApproveEstimate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => estimatesApi.approve(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Estimate approved');
    },
    onError: () => toast.error('Failed to approve estimate'),
  });
}

export function useRejectEstimate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => estimatesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Estimate rejected');
    },
    onError: () => toast.error('Failed to reject estimate'),
  });
}
