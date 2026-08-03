import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMetalRateInput, MetalRate } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const RATES_KEY = ['rate-master'] as const;

export function useMetalRates() {
  return useQuery({
    queryKey: RATES_KEY,
    queryFn: () => apiFetch<MetalRate[]>('/rate-master'),
  });
}

export function useCreateMetalRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMetalRateInput) =>
      apiFetch<MetalRate>('/rate-master', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          effectiveDate:
            input.effectiveDate instanceof Date
              ? input.effectiveDate.toISOString().slice(0, 10)
              : input.effectiveDate,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RATES_KEY });
    },
  });
}
