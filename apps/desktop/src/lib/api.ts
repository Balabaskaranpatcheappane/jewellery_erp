import { useAuthStore } from '@/store/auth';

const API_BASE_URL =
  window.erp?.apiBaseUrl ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    useAuthStore.getState().clear();
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ?? res.statusText;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}
