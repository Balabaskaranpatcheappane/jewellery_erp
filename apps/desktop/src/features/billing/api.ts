import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateInvoiceInput, Invoice, InvoiceSummary } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const INVOICES_KEY = ['billing', 'invoices'] as const;

export function useInvoices() {
  return useQuery({
    queryKey: INVOICES_KEY,
    queryFn: () => apiFetch<InvoiceSummary[]>('/billing/invoices'),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<Invoice>(`/billing/invoices/${id}`),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      apiFetch<Invoice>('/billing/invoices', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INVOICES_KEY });
      void qc.invalidateQueries({ queryKey: ['inventory', 'items'] });
    },
  });
}
