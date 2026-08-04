import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Karigar,
  CreateKarigarInput,
  JobOrder,
  CreateJobOrderInput,
  ReceiveJobOrderInput,
  Scheme,
  CreateSchemeInput,
  AddInstallmentInput,
  Branch,
  CreateBranchInput,
} from '@erp/shared';
import { apiFetch } from '@/lib/api';

const KARIGARS = ['ops', 'karigars'] as const;
const JOBS = ['ops', 'jobs'] as const;
const SCHEMES = ['ops', 'schemes'] as const;
const BRANCHES = ['ops', 'branches'] as const;

/* Karigars */
export function useKarigars() {
  return useQuery({ queryKey: KARIGARS, queryFn: () => apiFetch<Karigar[]>('/karigars') });
}
export function useCreateKarigar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKarigarInput) =>
      apiFetch<Karigar>('/karigars', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KARIGARS }),
  });
}

/* Job work */
export function useJobOrders() {
  return useQuery({ queryKey: JOBS, queryFn: () => apiFetch<JobOrder[]>('/job-orders') });
}
export function useCreateJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJobOrderInput) =>
      apiFetch<JobOrder>('/job-orders', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: JOBS });
      void qc.invalidateQueries({ queryKey: KARIGARS });
    },
  });
}
export function useReceiveJobOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: ReceiveJobOrderInput }) =>
      apiFetch<JobOrder>(`/job-orders/${args.id}/receive`, {
        method: 'PATCH',
        body: JSON.stringify(args.input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: JOBS });
      void qc.invalidateQueries({ queryKey: KARIGARS });
    },
  });
}

/* Schemes */
export function useSchemes() {
  return useQuery({ queryKey: SCHEMES, queryFn: () => apiFetch<Scheme[]>('/schemes') });
}
export function useCreateScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSchemeInput) =>
      apiFetch<Scheme>('/schemes', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEMES }),
  });
}
export function useAddInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: AddInstallmentInput }) =>
      apiFetch<Scheme>(`/schemes/${args.id}/installments`, {
        method: 'POST',
        body: JSON.stringify(args.input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEMES }),
  });
}

/* Branches */
export function useBranches() {
  return useQuery({ queryKey: BRANCHES, queryFn: () => apiFetch<Branch[]>('/branches') });
}
export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) =>
      apiFetch<Branch>('/branches', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BRANCHES }),
  });
}
