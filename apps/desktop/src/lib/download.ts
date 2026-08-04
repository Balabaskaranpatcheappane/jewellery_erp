import { useAuthStore } from '@/store/auth';

const API_BASE_URL = window.erp?.apiBaseUrl ?? 'http://localhost:3000/api';

async function fetchBlob(path: string): Promise<Blob> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}

/** Opens a report (e.g. a PDF) in a new window for viewing / printing. */
export async function openReport(path: string): Promise<void> {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Downloads a report to a file. */
export async function saveReport(path: string, filename: string): Promise<void> {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
