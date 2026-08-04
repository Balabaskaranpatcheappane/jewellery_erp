import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Loan,
  LoanSummary,
  CreateLoanInput,
  AddRepaymentInput,
} from '@erp/shared';
import { apiFetch } from '@/lib/api';

const LOANS_KEY = ['loans'] as const;

export function useLoans() {
  return useQuery({ queryKey: LOANS_KEY, queryFn: () => apiFetch<LoanSummary[]>('/loans') });
}

export function useLoan(id: string | undefined) {
  return useQuery({
    queryKey: [...LOANS_KEY, id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<Loan>(`/loans/${id}`),
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLoanInput) =>
      apiFetch<Loan>('/loans', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: LOANS_KEY }),
  });
}

export function useAddRepayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: AddRepaymentInput }) =>
      apiFetch<Loan>(`/loans/${args.id}/repayments`, {
        method: 'POST',
        body: JSON.stringify(args.input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: LOANS_KEY }),
  });
}

export function useCloseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Loan>(`/loans/${id}/close`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: LOANS_KEY }),
  });
}
