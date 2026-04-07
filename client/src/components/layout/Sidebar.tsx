import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Users,
  ShieldCheck,
  FileText,
  Receipt,
  CreditCard,
  Wrench,
  PlusCircle,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'finance'],
  },
  {
    label: 'My Dashboard',
    href: '/dashboard/technician',
    icon: BarChart3,
    roles: ['technician'],
  },
  {
    label: 'My Dashboard',
    href: '/dashboard/user',
    icon: LayoutDashboard,
    roles: ['user'],
  },
  {
    label: 'All Tickets',
    href: '/tickets',
    icon: Ticket,
    roles: ['admin', 'finance'],
  },
  {
    label: 'My Queue',
    href: '/tickets',
    icon: ClipboardList,
    roles: ['technician'],
  },
  {
    label: 'My Tickets',
    href: '/tickets',
    icon: Ticket,
    roles: ['user'],
  },
  {
    label: 'New Request',
    href: '/tickets/new',
    icon: PlusCircle,
    roles: ['user', 'technician'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'SLA Policies',
    href: '/admin/sla',
    icon: ShieldCheck,
    roles: ['admin'],
  },
  {
    label: 'Estimates',
    href: '/finance/estimates',
    icon: FileText,
    roles: ['finance', 'admin'],
  },
  {
    label: 'Invoices',
    href: '/finance/invoices',
    icon: Receipt,
    roles: ['finance', 'admin'],
  },
  {
    label: 'Payments',
    href: '/finance/payments',
    icon: CreditCard,
    roles: ['finance', 'admin'],
  },
];

export function Sidebar() {
  const { user } = useAuthContext();
  const location = useLocation();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fixflow-primary">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">FixFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/dashboard' &&
                item.href !== '/dashboard/technician' &&
                item.href !== '/dashboard/user' &&
                location.pathname.startsWith(item.href));

            return (
              <li key={`${item.label}-${item.href}`}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-l-2 border-fixflow-primary bg-sidebar-active text-white pl-[10px]'
                      : 'text-sidebar-foreground hover:bg-sidebar-active hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fixflow-primary text-xs font-semibold text-white uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
