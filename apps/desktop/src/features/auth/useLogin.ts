import { useMutation } from '@tanstack/react-query';
import type { LoginInput, LoginResponse } from '@erp/shared';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
    },
  });
}
