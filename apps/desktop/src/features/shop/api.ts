import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShopProfile, UpdateShopProfileInput } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const SHOP_KEY = ['shop'] as const;

export function useShop() {
  return useQuery({
    queryKey: SHOP_KEY,
    queryFn: () => apiFetch<ShopProfile>('/shop'),
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateShopProfileInput) =>
      apiFetch<ShopProfile>('/shop', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHOP_KEY }),
  });
}
