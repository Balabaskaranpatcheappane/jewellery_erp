import { useQuery } from '@tanstack/react-query';
import type { SalesPeriod, SalesReport } from '@erp/shared';
import { apiFetch } from '@/lib/api';

export function salesQuery(period: SalesPeriod, from: string, to: string): string {
  const p = new URLSearchParams({ period, from, to });
  return `?${p.toString()}`;
}

export function useSalesReport(period: SalesPeriod, from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'sales', period, from, to],
    queryFn: () => apiFetch<SalesReport>(`/reports/sales${salesQuery(period, from, to)}`),
  });
}
