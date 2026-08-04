import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer, CreateCustomerInput } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const CUSTOMERS_KEY = ['customers'] as const;

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, search ?? ''],
    queryFn: () =>
      apiFetch<Customer[]>(
        `/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      ),
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      apiFetch<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}
