import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  createLoanSchema,
  MetalType,
  type CreateLoanInput,
} from '@erp/shared';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inr } from '@/lib/format';
import { useCustomers } from '@/features/customers/api';
import { useLoans, useCreateLoan } from '@/features/loans/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const cell = 'h-8 px-2';

const statusStyles: Record<string, string> = {
  ACTIVE: 'text-emerald-500',
  CLOSED: 'text-muted-foreground',
  DEFAULTED: 'text-destructive',
};

export function LoansPage() {
  const navigate = useNavigate();
  const customers = useCustomers();
  const loans = useLoans();
  const createLoan = useCreateLoan();

  const { register, control, handleSubmit, reset, formState } = useForm<CreateLoanInput>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      customerId: '',
      principal: 0,
      interestRatePercent: 2,
      notes: '',
      items: [],
    },
  });
  const items = useFieldArray({ control, name: 'items' });

  const addItem = () =>
    items.append({
      description: '',
      metal: MetalType.GOLD,
      purity: '916',
      grossWeightGram: 0,
      netWeightGram: 0,
      estimatedValue: 0,
    });

  const onSubmit = (v: CreateLoanInput) =>
    createLoan.mutate(v, {
      onSuccess: (loan) => {
        reset();
        navigate(`/loans/${loan.id}`);
      },
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gold Loans</h1>
        <p className="text-sm text-muted-foreground">
          Loans against pledged jewelry — monthly interest, repayments and
          outstanding tracking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New loan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lcust">Customer</Label>
                <select id="lcust" className={selectClass} {...register('customerId')}>
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
                <Label htmlFor="lprincipal">Principal ₹</Label>
                <Input id="lprincipal" type="number" step="0.01" {...register('principal')} />
                {formState.errors.principal && (
                  <p className="text-xs text-destructive">{formState.errors.principal.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lrate">Interest %/mo</Label>
                <Input id="lrate" type="number" step="0.001" {...register('interestRatePercent')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lstart">Start date</Label>
                <Input id="lstart" type="date" {...register('startDate')} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pledged items</span>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-4" /> Add item
              </Button>
            </div>
            {items.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add at least one pledged item.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-1 pr-2 font-medium">Description</th>
                      <th className="py-1 pr-2 font-medium">Metal</th>
                      <th className="py-1 pr-2 font-medium">Purity</th>
                      <th className="py-1 pr-2 font-medium">Gross g</th>
                      <th className="py-1 pr-2 font-medium">Net g</th>
                      <th className="py-1 pr-2 font-medium">Est. value</th>
                      <th className="py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.fields.map((f, i) => (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="py-1 pr-2">
                          <Input className={`${cell} min-w-40`} {...register(`items.${i}.description`)} />
                        </td>
                        <td className="py-1 pr-2">
                          <select className={selectClass} {...register(`items.${i}.metal`)}>
                            <option value={MetalType.GOLD}>Gold</option>
                            <option value={MetalType.SILVER}>Silver</option>
                            <option value={MetalType.PLATINUM}>Platinum</option>
                          </select>
                        </td>
                        <td className="py-1 pr-2">
                          <Input className={`${cell} w-16`} {...register(`items.${i}.purity`)} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input className={`${cell} w-20`} type="number" step="0.001" {...register(`items.${i}.grossWeightGram`)} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input className={`${cell} w-20`} type="number" step="0.001" {...register(`items.${i}.netWeightGram`)} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input className={`${cell} w-24`} type="number" step="0.01" {...register(`items.${i}.estimatedValue`)} />
                        </td>
                        <td className="py-1 text-right">
                          <Button type="button" variant="ghost" size="icon" onClick={() => items.remove(i)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {formState.errors.items?.message && (
              <p className="text-xs text-destructive">{formState.errors.items.message}</p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={createLoan.isPending}>
                {createLoan.isPending ? 'Saving…' : 'Create loan'}
              </Button>
              {createLoan.isError && (
                <span className="text-sm text-destructive">{(createLoan.error as Error).message}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {loans.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : loans.data && loans.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Loan #</th>
                    <th className="py-2 pr-4 font-medium">Customer</th>
                    <th className="py-2 pr-4 font-medium">Start</th>
                    <th className="py-2 pr-4 text-right font-medium">Principal</th>
                    <th className="py-2 pr-4 text-right font-medium">%/mo</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 text-right font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.data.map((l) => (
                    <tr
                      key={l.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-accent/50"
                      onClick={() => navigate(`/loans/${l.id}`)}
                    >
                      <td className="py-2 pr-4 font-medium">{l.loanNo}</td>
                      <td className="py-2 pr-4">{l.customerName ?? '—'}</td>
                      <td className="py-2 pr-4">{l.startDate}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{inr(l.principal)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{l.interestRatePercent}</td>
                      <td className={`py-2 pr-4 font-medium ${statusStyles[l.status] ?? ''}`}>{l.status}</td>
                      <td className="py-2 pr-4 text-right font-medium tabular-nums">{inr(l.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No loans yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
