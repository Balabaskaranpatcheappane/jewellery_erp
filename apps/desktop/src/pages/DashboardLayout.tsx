import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Gem,
  LayoutDashboard,
  LineChart,
  LogOut,
  Package,
  Tags,
  Users,
  Receipt,
  Hammer,
  PiggyBank,
  Building2,
  Settings,
  UserCog,
  Landmark,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  adminOnly?: boolean;
}

const nav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/rate-master', label: 'Rate Master', icon: LineChart, end: false },
  { to: '/inventory', label: 'Inventory', icon: Package, end: true },
  { to: '/inventory/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/customers', label: 'Customers', icon: Users, end: false },
  { to: '/billing', label: 'Billing', icon: Receipt, end: false },
  { to: '/reports/sales', label: 'Sales Report', icon: BarChart3, end: false },
  { to: '/job-work', label: 'Job Work', icon: Hammer, end: false },
  { to: '/schemes', label: 'Schemes', icon: PiggyBank, end: false },
  { to: '/loans', label: 'Gold Loans', icon: Landmark, end: false },
  { to: '/branches', label: 'Branches', icon: Building2, end: false },
  { to: '/users', label: 'Users', icon: UserCog, end: false, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const logout = () => {
    clear();
    navigate('/login');
  };

  // Auto sign-out after 40 minutes of inactivity.
  useIdleTimeout(40 * 60 * 1000, () => {
    clear();
    navigate('/login', { replace: true });
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-6 py-5">
          <Gem className="text-primary" />
          <span className="font-semibold">Jewelry ERP</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav
            .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="px-2 pb-2 text-xs text-muted-foreground">
            {user?.name} · {user?.role}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
