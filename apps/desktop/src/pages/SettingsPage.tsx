import { useState } from 'react';
import { DatabaseBackup, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { useBackups, useCreateBackup, useRestoreBackup } from '@/features/admin/api';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const backups = useBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Database backup and restore for your local PostgreSQL instance.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Backups</CardTitle>
            <CardDescription>
              Snapshots are written on the machine running the API (pg_dump custom
              format).
            </CardDescription>
          </div>
          <Button
            disabled={!isAdmin || createBackup.isPending}
            onClick={() =>
              createBackup.mutate(undefined, {
                onSuccess: (b) => setMessage(`Backup created: ${b.filename}`),
                onError: (e) => setMessage((e as Error).message),
              })
            }
          >
            <DatabaseBackup className="size-4" />
            {createBackup.isPending ? 'Backing up…' : 'Backup now'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Backup and restore require an admin account.
            </p>
          )}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          {backups.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : backups.data && backups.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">File</th>
                    <th className="py-2 pr-4 font-medium">Size</th>
                    <th className="py-2 pr-4 font-medium">Created</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {backups.data.map((b) => (
                    <tr key={b.filename} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{b.filename}</td>
                      <td className="py-2 pr-4 tabular-nums">{formatSize(b.sizeBytes)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        {confirming === b.filename ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-destructive">Overwrite DB?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={restoreBackup.isPending}
                              onClick={() =>
                                restoreBackup.mutate(b.filename, {
                                  onSuccess: () => {
                                    setConfirming(null);
                                    setMessage(`Restored from ${b.filename}`);
                                  },
                                  onError: (e) => setMessage((e as Error).message),
                                })
                              }
                            >
                              Yes, restore
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                              Cancel
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isAdmin}
                            onClick={() => setConfirming(b.filename)}
                          >
                            <RotateCcw className="size-4" /> Restore
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No backups yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
