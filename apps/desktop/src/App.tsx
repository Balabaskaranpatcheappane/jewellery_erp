import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/store/auth';
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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
