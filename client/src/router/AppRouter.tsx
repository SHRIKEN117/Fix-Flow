import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/context/AuthContext';

// Auth pages (eager — always needed immediately)
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Lazy-loaded page chunks
const AdminDashboard = lazy(() =>
  import('@/pages/dashboard/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const TechnicianDashboard = lazy(() =>
  import('@/pages/dashboard/TechnicianDashboard').then((m) => ({ default: m.TechnicianDashboard }))
);
const FinanceDashboard = lazy(() =>
  import('@/pages/dashboard/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard }))
);
const UserDashboard = lazy(() =>
  import('@/pages/dashboard/UserDashboard').then((m) => ({ default: m.UserDashboard }))
);
const TicketListPage = lazy(() =>
  import('@/pages/tickets/TicketListPage').then((m) => ({ default: m.TicketListPage }))
);
const TicketDetailPage = lazy(() =>
  import('@/pages/tickets/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage }))
);
const NewTicketPage = lazy(() =>
  import('@/pages/tickets/NewTicketPage').then((m) => ({ default: m.NewTicketPage }))
);
const EstimatesPage = lazy(() =>
  import('@/pages/finance/EstimatesPage').then((m) => ({ default: m.EstimatesPage }))
);
const EstimateDetailPage = lazy(() =>
  import('@/pages/finance/EstimateDetailPage').then((m) => ({ default: m.EstimateDetailPage }))
);
const NewEstimatePage = lazy(() =>
  import('@/pages/finance/NewEstimatePage').then((m) => ({ default: m.NewEstimatePage }))
);
const InvoicesPage = lazy(() =>
  import('@/pages/finance/InvoicesPage').then((m) => ({ default: m.InvoicesPage }))
);
const InvoiceDetailPage = lazy(() =>
  import('@/pages/finance/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage }))
);
const NewInvoicePage = lazy(() =>
  import('@/pages/finance/NewInvoicePage').then((m) => ({ default: m.NewInvoicePage }))
);
const PaymentsPage = lazy(() =>
  import('@/pages/finance/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))
);
const NewPaymentPage = lazy(() =>
  import('@/pages/finance/NewPaymentPage').then((m) => ({ default: m.NewPaymentPage }))
);
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const SLAPoliciesPage = lazy(() =>
  import('@/pages/admin/SLAPoliciesPage').then((m) => ({ default: m.SLAPoliciesPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuthContext();
  if (!user) return null;
  if (user.role === 'technician') return <Navigate to="/dashboard/technician" replace />;
  if (user.role === 'finance') return <Navigate to="/dashboard/finance" replace />;
  if (user.role === 'user') return <Navigate to="/dashboard/user" replace />;
  return <Navigate to="/dashboard/admin" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* All authenticated routes live inside AppShell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>

              {/* Dashboard hub — redirects by role */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<AdminDashboard />} />
              </Route>
              <Route path="/dashboard/finance" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<FinanceDashboard />} />
              </Route>
              <Route path="/dashboard/technician" element={
                <ProtectedRoute allowedRoles={['admin', 'technician']} />
              }>
                <Route index element={<TechnicianDashboard />} />
              </Route>
              <Route path="/dashboard/user" element={
                <ProtectedRoute allowedRoles={['user', 'admin']} />
              }>
                <Route index element={<UserDashboard />} />
              </Route>

              {/* Tickets */}
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/tickets/new" element={<NewTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />

              {/* Finance */}
              <Route path="/finance/estimates" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<EstimatesPage />} />
              </Route>
              <Route path="/finance/estimates/new" element={
                <ProtectedRoute allowedRoles={['finance']} />
              }>
                <Route index element={<NewEstimatePage />} />
              </Route>
              <Route path="/finance/estimates/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<EstimateDetailPage />} />
              </Route>

              <Route path="/finance/invoices" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<InvoicesPage />} />
              </Route>
              <Route path="/finance/invoices/new" element={
                <ProtectedRoute allowedRoles={['finance']} />
              }>
                <Route index element={<NewInvoicePage />} />
              </Route>
              <Route path="/finance/invoices/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<InvoiceDetailPage />} />
              </Route>

              <Route path="/finance/payments" element={
                <ProtectedRoute allowedRoles={['admin', 'finance']} />
              }>
                <Route index element={<PaymentsPage />} />
              </Route>
              <Route path="/finance/payments/new" element={
                <ProtectedRoute allowedRoles={['finance']} />
              }>
                <Route index element={<NewPaymentPage />} />
              </Route>

              {/* Admin */}
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<UsersPage />} />
              </Route>
              <Route path="/admin/sla" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<SLAPoliciesPage />} />
              </Route>

              {/* 404 inside shell */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
