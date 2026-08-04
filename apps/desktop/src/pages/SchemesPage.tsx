import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSchemeSchema, type CreateSchemeInput } from '@erp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inr } from '@/lib/format';
import { useCustomers } from '@/features/customers/api';
import { useSchemes, useCreateScheme, useAddInstallment } from '@/features/operations/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const statusStyles: Record<string, string> = {
  ACTIVE: 'text-emerald-500',
  COMPLETED: 'text-sky-500',
  CANCELLED: 'text-destructive',
};

export function SchemesPage() {
  const customers = useCustomers();
  const schemes = useSchemes();
  const createScheme = useCreateScheme();
  const addInstallment = useAddInstallment();

  const { register, handleSubmit, reset, formState } = useForm<CreateSchemeInput>({
    resolver: zodResolver(createSchemeSchema),
    defaultValues: { customerId: '', name: '', monthlyAmount: 0, durationMonths: 11 },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Savings Schemes</h1>
        <p className="text-sm text-muted-foreground">
          Monthly gold-savings / chit plans and installment tracking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New scheme</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => createScheme.mutate(v, { onSuccess: () => reset() }))}
            className="grid grid-cols-1 gap-4 sm:grid-cols-5"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="scust">Customer</Label>
              <select id="scust" className={selectClass} {...register('customerId')}>
                <option value="">Select…</option>
                {customers.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
                ))}
              </select>
              {formState.errors.customerId && (
                <p className="text-xs text-destructive">{formState.errors.customerId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sname">Plan name</Label>
              <Input id="sname" placeholder="Gold-11" {...register('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="samount">Monthly ₹</Label>
              <Input id="samount" type="number" step="0.01" {...register('monthlyAmount')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdur">Months</Label>
              <Input id="sdur" type="number" step="1" {...register('durationMonths')} />
            </div>
            <div className="flex items-end sm:col-span-5">
              <Button type="submit" disabled={createScheme.isPending}>Create scheme</Button>
            </div>
          </form>
          {createScheme.isError && (
            <p className="mt-3 text-sm text-destructive">{(createScheme.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active & past schemes</CardTitle>
        </CardHeader>
        <CardContent>
          {schemes.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : schemes.data && schemes.data.length > 0 ? (
            <div className="space-y-3">
              {schemes.data.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">{s.name}</span> · {s.customerName} ·{' '}
                    {inr(s.monthlyAmount)}/mo
                    <span className={`ml-2 font-medium ${statusStyles[s.status] ?? ''}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {s.paidCount}/{s.durationMonths} paid · {inr(s.paidTotal)}
                    </span>
                    {s.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={addInstallment.isPending}
                        onClick={() =>
                          addInstallment.mutate({
                            id: s.id,
                            input: { amount: s.monthlyAmount },
                          })
                        }
                      >
                        Pay installment
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No schemes yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
