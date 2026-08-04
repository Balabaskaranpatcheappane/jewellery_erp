import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BackupFile } from '@erp/shared';
import { apiFetch } from '@/lib/api';

const BACKUPS_KEY = ['admin', 'backups'] as const;

export function useBackups() {
  return useQuery({
    queryKey: BACKUPS_KEY,
    queryFn: () => apiFetch<BackupFile[]>('/admin/backups'),
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<BackupFile>('/admin/backups', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BACKUPS_KEY }),
  });
}

export function useRestoreBackup() {
  return useMutation({
    mutationFn: (filename: string) =>
      apiFetch<{ restored: string }>('/admin/backups/restore', {
        method: 'POST',
        body: JSON.stringify({ filename }),
      }),
  });
}
