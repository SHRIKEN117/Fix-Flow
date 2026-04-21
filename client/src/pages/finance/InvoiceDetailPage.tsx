import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { useInvoice, useIssueInvoice } from '@/hooks/useInvoices';
import { useAuthContext } from '@/context/AuthContext';
import { Invoice, Ticket } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INVOICE_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data, isLoading } = useInvoice(id!);
  const issue = useIssueInvoice(id!);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const invoice = data?.data as Invoice;
  if (!invoice) return <p className="text-sm text-fixflow-muted">Invoice not found.</p>;

  const ticket = typeof invoice.ticketId === 'object' ? invoice.ticketId as Ticket : null;
  const canIssue = user?.role === 'admin' && invoice.status === 'draft';

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`For: ${ticket?.title ?? 'Unknown Ticket'}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize',
            INVOICE_STATUS_COLORS[invoice.status]
          )}
        >
          {invoice.status}
        </span>
        {canIssue && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => issue.mutateAsync()}
            disabled={issue.isPending}
          >
            <Send className="h-4 w-4" />
            Issue Invoice
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Invoice Number</span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>
          {invoice.issuedAt && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Issued Date</span>
              <span>{formatDate(invoice.issuedAt)}</span>
            </div>
          )}
          {invoice.dueDate && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Due Date</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Tax</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
