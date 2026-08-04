import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/store/auth';
import { useLicenseStatus } from '@/features/license/api';
import { ActivationScreen } from '@/pages/ActivationScreen';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardLayout } from '@/pages/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { RateMasterPage } from '@/pages/RateMasterPage';
import { ItemsPage } from '@/pages/ItemsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { NewInvoicePage } from '@/pages/NewInvoicePage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import { JobWorkPage } from '@/pages/JobWorkPage';
import { SchemesPage } from '@/pages/SchemesPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { LoansPage } from '@/pages/LoansPage';
import { LoanDetailPage } from '@/pages/LoanDetailPage';
import { SalesReportPage } from '@/pages/SalesReportPage';

function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/rate-master', element: <RateMasterPage /> },
          { path: '/inventory', element: <ItemsPage /> },
          { path: '/inventory/categories', element: <CategoriesPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/billing', element: <InvoicesPage /> },
          { path: '/billing/new', element: <NewInvoicePage /> },
          { path: '/billing/invoices/:id', element: <InvoiceDetailPage /> },
          { path: '/reports/sales', element: <SalesReportPage /> },
          { path: '/job-work', element: <JobWorkPage /> },
          { path: '/schemes', element: <SchemesPage /> },
          { path: '/loans', element: <LoansPage /> },
          { path: '/loans/:id', element: <LoanDetailPage /> },
          { path: '/branches', element: <BranchesPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/users', element: <UsersPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function LicenseGate() {
  const license = useLicenseStatus();
  if (license.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (license.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
        Cannot reach the server. Make sure the API is running on
        http://localhost:3000, then reload.
      </div>
    );
  }
  if (!license.data?.activated) {
    return <ActivationScreen />;
  }
  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LicenseGate />
    </QueryClientProvider>
  );
}
