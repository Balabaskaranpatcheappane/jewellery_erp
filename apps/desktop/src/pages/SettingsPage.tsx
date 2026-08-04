import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateShopProfileSchema, type UpdateShopProfileInput } from '@erp/shared';
import { DatabaseBackup, RotateCcw, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { useBackups, useCreateBackup, useRestoreBackup } from '@/features/admin/api';
import { useShop, useUpdateShop } from '@/features/shop/api';

function ShopProfileCard({ isAdmin }: { isAdmin: boolean }) {
  const shop = useShop();
  const updateShop = useUpdateShop();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="size-4" /> Shop profile
        </CardTitle>
        <CardDescription>
          Printed on the header of every invoice PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shop.isLoading || !shop.data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ShopProfileForm
            isAdmin={isAdmin}
            initial={{
              name: shop.data.name,
              address: shop.data.address ?? '',
              phone: shop.data.phone ?? '',
              gstin: shop.data.gstin ?? '',
            }}
            pending={updateShop.isPending}
            error={updateShop.isError ? (updateShop.error as Error).message : null}
            saved={updateShop.isSuccess}
            onSave={(v) => updateShop.mutate(v)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ShopProfileForm({
  isAdmin,
  initial,
  pending,
  error,
  saved,
  onSave,
}: {
  isAdmin: boolean;
  initial: UpdateShopProfileInput;
  pending: boolean;
  error: string | null;
  saved: boolean;
  onSave: (v: UpdateShopProfileInput) => void;
}) {
  const { register, handleSubmit, formState } = useForm<UpdateShopProfileInput>({
    resolver: zodResolver(updateShopProfileSchema),
    defaultValues: initial,
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="shopName">Shop name</Label>
        <Input id="shopName" disabled={!isAdmin} {...register('name')} />
        {formState.errors.name && (
          <p className="text-xs text-destructive">{formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="shopPhone">Phone</Label>
        <Input id="shopPhone" disabled={!isAdmin} {...register('phone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shopGstin">GSTIN</Label>
        <Input id="shopGstin" disabled={!isAdmin} {...register('gstin')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shopAddress">Address</Label>
        <Input id="shopAddress" disabled={!isAdmin} {...register('address')} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={!isAdmin || pending}>
          {pending ? 'Saving…' : 'Save shop profile'}
        </Button>
        {saved && <span className="text-sm text-emerald-500">Saved</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
        {!isAdmin && (
          <span className="text-sm text-muted-foreground">Admins only</span>
        )}
      </div>
    </form>
  );
}

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
          Shop profile and database backup / restore.
        </p>
      </div>

      <ShopProfileCard isAdmin={isAdmin} />

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
