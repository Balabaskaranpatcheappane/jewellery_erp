import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createMetalRateSchema,
  MetalType,
  type CreateMetalRateInput,
} from '@erp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCreateMetalRate, useMetalRates } from '@/features/rate-master/api';

const today = new Date().toISOString().slice(0, 10);

export function RateMasterPage() {
  const rates = useMetalRates();
  const createRate = useCreateMetalRate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMetalRateInput>({
    resolver: zodResolver(createMetalRateSchema),
    defaultValues: {
      metal: MetalType.GOLD,
      purity: '916',
      ratePerGram: 0,
      effectiveDate: new Date(today),
    },
  });

  const onSubmit = (values: CreateMetalRateInput) =>
    createRate.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rate Master</h1>
        <p className="text-sm text-muted-foreground">
          Daily precious-metal rates. The most recent effective date is the
          active rate used for billing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add / update rate</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-5"
          >
            <div className="space-y-2">
              <Label htmlFor="metal">Metal</Label>
              <select
                id="metal"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('metal')}
              >
                <option value={MetalType.GOLD}>Gold</option>
                <option value={MetalType.SILVER}>Silver</option>
                <option value={MetalType.PLATINUM}>Platinum</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purity">Purity</Label>
              <Input id="purity" placeholder="916" {...register('purity')} />
              {errors.purity && (
                <p className="text-xs text-destructive">
                  {errors.purity.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ratePerGram">Rate / gram (₹)</Label>
              <Input
                id="ratePerGram"
                type="number"
                step="0.001"
                {...register('ratePerGram')}
              />
              {errors.ratePerGram && (
                <p className="text-xs text-destructive">
                  {errors.ratePerGram.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective date</Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register('effectiveDate')}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={createRate.isPending}
              >
                {createRate.isPending ? 'Saving…' : 'Save rate'}
              </Button>
            </div>
          </form>
          {createRate.isError && (
            <p className="mt-3 text-sm text-destructive">
              {(createRate.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate history</CardTitle>
        </CardHeader>
        <CardContent>
          {rates.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rates.isError ? (
            <p className="text-sm text-destructive">
              {(rates.error as Error).message}
            </p>
          ) : rates.data && rates.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Metal</th>
                    <th className="py-2 pr-4 font-medium">Purity</th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Rate / g (₹)
                    </th>
                    <th className="py-2 pr-4 font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.data.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.effectiveDate}</td>
                      <td className="py-2 pr-4">{r.metal}</td>
                      <td className="py-2 pr-4">{r.purity}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {r.ratePerGram.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.createdByName ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No rates yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
