import { Ticket, AlertTriangle, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TicketStatusChart } from '@/components/dashboard/TicketStatusChart';
import { FinancialSummary } from '@/components/dashboard/FinancialSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';

export function AdminDashboard() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const metrics = data?.data.metrics;
  const statusDistribution = data?.data.statusDistribution ?? {};
  const slaDistribution = data?.data.slaDistribution ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System-wide maintenance overview"
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tickets"
          value={metrics?.totalTickets ?? 0}
          trend={metrics?.ticketTrend}
          icon={<Ticket className="h-5 w-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Open Tickets"
          value={metrics?.openTickets ?? 0}
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-amber-50 text-amber-600"
        />
        <MetricCard
          title="SLA Breached"
          value={metrics?.breachedTickets ?? 0}
          subtitle="Currently active"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="bg-red-50 text-red-600"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="bg-green-50 text-green-600"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Users"
          value={metrics?.totalUsers ?? 0}
          icon={<Users className="h-5 w-5" />}
          iconColor="bg-purple-50 text-purple-600"
        />
        <MetricCard
          title="Closed Tickets"
          value={metrics?.closedTickets ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="bg-green-50 text-green-600"
        />
        <MetricCard
          title="SLA On Track"
          value={slaDistribution['on_track'] ?? 0}
          subtitle="Open tickets"
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketStatusChart distribution={statusDistribution} />
        <FinancialSummary
          totalRevenue={metrics?.totalRevenue ?? 0}
          openTickets={metrics?.openTickets ?? 0}
          closedTickets={metrics?.closedTickets ?? 0}
        />
      </div>
    </div>
  );
}
