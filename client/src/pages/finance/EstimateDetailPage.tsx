import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEstimate, useApproveEstimate, useRejectEstimate } from '@/hooks/useEstimates';
import { useAuthContext } from '@/context/AuthContext';
import { Estimate, Ticket, User, EstimateItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ESTIMATE_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data, isLoading } = useEstimate(id!);
  const approve = useApproveEstimate(id!);
  const reject = useRejectEstimate(id!);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const estimate = data?.data as Estimate;
  if (!estimate) return <p className="text-sm text-fixflow-muted">Estimate not found.</p>;

  const ticket = typeof estimate.ticketId === 'object' ? estimate.ticketId as Ticket : null;
  const createdBy = typeof estimate.createdBy === 'object' ? estimate.createdBy as User : null;

  const canApproveReject =
    user?.role === 'admin' &&
    (estimate.status === 'draft' || estimate.status === 'submitted');

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <PageHeader
        title={estimate.estimateNumber}
        subtitle={`For: ${ticket?.title ?? 'Unknown Ticket'}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize',
            ESTIMATE_STATUS_COLORS[estimate.status]
          )}
        >
          {estimate.status}
        </span>
        {canApproveReject && (
          <>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => approve.mutateAsync(undefined)}
              disabled={approve.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              onClick={() => reject.mutateAsync(undefined)}
              disabled={reject.isPending}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left text-fixflow-muted">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Unit Price</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(estimate.items ?? []).map((item: EstimateItem) => (
                <tr key={item._id}>
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 capitalize text-fixflow-muted">{item.type}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <Separator className="my-4" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Subtotal</span>
              <span>{formatCurrency(estimate.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Tax</span>
              <span>{formatCurrency(estimate.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(estimate.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {estimate.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
