import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSLAPolicies, useCreateSLAPolicy, useTriggerSLASweep } from '@/hooks/useSLA';
import { SLAPolicy } from '@/types';
import { createSLAPolicySchema, CreateSLAPolicyFormData } from '@/lib/validations';

export function SLAPoliciesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useSLAPolicies();
  const createPolicy = useCreateSLAPolicy();
  const triggerSweep = useTriggerSLASweep();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateSLAPolicyFormData>({
    resolver: zodResolver(createSLAPolicySchema),
  });

  const onSubmit = async (data: CreateSLAPolicyFormData) => {
    await createPolicy.mutateAsync(data);
    reset();
    setDialogOpen(false);
  };

  const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];
  const policies = [...(data?.data ?? [])].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  const PRIORITY_COLORS: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Policies"
        subtitle="Configure response and resolution time targets"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSweep.mutateAsync()}
              disabled={triggerSweep.isPending}
              className="gap-2"
            >
              {triggerSweep.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Run SLA Sweep
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Policy
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRIORITY_ORDER.map((priority) => {
          const policy = policies.find((p) => p.priority === priority);

          return (
            <Card key={priority} className={!policy ? 'opacity-60 border-dashed' : ''}>
              <CardHeader className="pb-2">
                <div
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize mb-1 ${PRIORITY_COLORS[priority]}`}
                >
                  {priority}
                </div>
                <CardTitle className="text-sm capitalize">{priority} Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {policy ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-fixflow-muted">Response Time</span>
                      <span className="font-medium">{policy.responseTimeHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fixflow-muted">Resolution Time</span>
                      <span className="font-medium">{policy.resolutionTimeHours}h</span>
                    </div>
                  </>
                ) : (
                  <p className="text-fixflow-muted text-xs">No policy configured</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create SLA Policy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select onValueChange={(v) => setValue('priority', v as CreateSLAPolicyFormData['priority'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responseTimeHours">Response Time (hours) *</Label>
                <Input
                  id="responseTimeHours"
                  type="number"
                  min={1}
                  placeholder="4"
                  {...register('responseTimeHours', { valueAsNumber: true })}
                />
                {errors.responseTimeHours && (
                  <p className="text-xs text-destructive">{errors.responseTimeHours.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolutionTimeHours">Resolution Time (hours) *</Label>
                <Input
                  id="resolutionTimeHours"
                  type="number"
                  min={1}
                  placeholder="24"
                  {...register('resolutionTimeHours', { valueAsNumber: true })}
                />
                {errors.resolutionTimeHours && (
                  <p className="text-xs text-destructive">{errors.resolutionTimeHours.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPolicy.isPending}>
                {createPolicy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Policy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
