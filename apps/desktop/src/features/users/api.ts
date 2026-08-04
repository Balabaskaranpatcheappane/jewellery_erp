import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateUserInput, UserRecord } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const USERS_KEY = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => apiFetch<UserRecord[]>('/users'),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiFetch<UserRecord>('/users', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      apiFetch<UserRecord>(`/users/${args.id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: args.isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
