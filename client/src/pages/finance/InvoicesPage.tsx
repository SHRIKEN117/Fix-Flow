import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice, Ticket } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INVOICE_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function InvoicesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useInvoices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle={`${data?.total ?? 0} total invoices`}
        action={
          <Button onClick={() => navigate('/finance/invoices/new')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-white">
          <p className="text-sm text-fixflow-muted">No invoices yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((invoice: Invoice) => {
                const ticket = typeof invoice.ticketId === 'object' ? invoice.ticketId as Ticket : null;
                return (
                  <TableRow
                    key={invoice._id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/finance/invoices/${invoice._id}`)}
                  >
                    <TableCell className="font-mono text-xs">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{ticket?.title ?? '—'}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                          INVOICE_STATUS_COLORS[invoice.status]
                        )}
                      >
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className="text-xs text-fixflow-muted">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-fixflow-muted">
                      {invoice.issuedAt ? formatDate(invoice.issuedAt) : 'Not issued'}
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
