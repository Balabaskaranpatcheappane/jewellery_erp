import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LicenseStatus } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const LICENSE_KEY = ['license'] as const;

export function useLicenseStatus() {
  return useQuery({
    queryKey: LICENSE_KEY,
    queryFn: () => apiFetch<LicenseStatus>('/license'),
    retry: false,
    staleTime: 60_000,
  });
}

export function useActivateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) =>
      apiFetch<LicenseStatus>('/license/activate', {
        method: 'POST',
        body: JSON.stringify({ key }),
      }),
    onSuccess: (status) => qc.setQueryData(LICENSE_KEY, status),
  });
}
