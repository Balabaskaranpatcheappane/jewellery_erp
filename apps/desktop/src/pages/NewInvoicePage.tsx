import { useState } from 'react';
import { useForm, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  createInvoiceSchema,
  computeInvoice,
  MakingChargeType,
  MetalType,
  type CreateInvoiceInput,
  type Item,
  type MetalRate,
} from '@erp/shared';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inr } from '@/lib/format';
import { useCustomers } from '@/features/customers/api';
import { useItems } from '@/features/inventory/api';
import { useMetalRates } from '@/features/rate-master/api';
import { useCreateInvoice } from '@/features/billing/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const cellInput = 'h-8 px-2';

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function latestRate(rates: MetalRate[] | undefined, metal: string, purity: string) {
  return rates?.find((r) => r.metal === metal && r.purity === purity)?.ratePerGram ?? 0;
}

/** Live totals panel driven by the same compute engine the server uses. */
function Totals({ control }: { control: Control<CreateInvoiceInput> }) {
  const values = useWatch({ control });
  const totals = computeInvoice({
    cgstPercent: n(values.cgstPercent),
    sgstPercent: n(values.sgstPercent),
    lines: (values.lines ?? []).map((l) => ({
      netWeightGram: n(l?.netWeightGram),
      ratePerGram: n(l?.ratePerGram),
      makingType: (l?.makingType ?? MakingChargeType.PER_GRAM) as MakingChargeType,
      makingRate: n(l?.makingRate),
      wastagePercent: n(l?.wastagePercent),
      quantity: n(l?.quantity) || 1,
    })),
    oldGold: (values.oldGold ?? []).map((g) => ({
      grossWeightGram: n(g?.grossWeightGram),
      deductionPercent: n(g?.deductionPercent),
      ratePerGram: n(g?.ratePerGram),
    })),
  });
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between ${strong ? 'text-base font-semibold' : 'text-sm'}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
  return (
    <div className="space-y-1.5">
      {row('Subtotal', inr(totals.subtotal))}
      {row(`CGST (${n(values.cgstPercent)}%)`, inr(totals.cgst))}
      {row(`SGST (${n(values.sgstPercent)}%)`, inr(totals.sgst))}
      {totals.oldGoldValue > 0 && row('Old gold', `- ${inr(totals.oldGoldValue)}`)}
      {totals.roundOff !== 0 && row('Round off', inr(totals.roundOff))}
      <div className="my-1 border-t" />
      {row('Grand total', inr(totals.grandTotal), true)}
    </div>
  );
}

export function NewInvoicePage() {
  const navigate = useNavigate();
  const customers = useCustomers();
  const items = useItems();
  const rates = useMetalRates();
  const createInvoice = useCreateInvoice();

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      customerId: '',
      cgstPercent: 1.5,
      sgstPercent: 1.5,
      notes: '',
      lines: [],
      oldGold: [],
    },
  });
  const { register, control, handleSubmit, formState } = form;
  const lines = useFieldArray({ control, name: 'lines' });
  const oldGold = useFieldArray({ control, name: 'oldGold' });

  const inStock = (items.data ?? []).filter((i) => i.status === 'IN_STOCK');

  const [scan, setScan] = useState('');
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const scanAdd = (raw: string) => {
    const sku = raw.trim();
    if (!sku) return;
    const item = inStock.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
    if (item) {
      addFromItem(item);
      setScanMsg(null);
    } else {
      setScanMsg(`No in-stock item with SKU "${sku}"`);
    }
    setScan('');
  };

  const addBlankLine = () =>
    lines.append({
      itemId: null,
      description: '',
      metal: MetalType.GOLD,
      purity: '916',
      netWeightGram: 0,
      ratePerGram: 0,
      makingType: MakingChargeType.PER_GRAM,
      makingRate: 0,
      wastagePercent: 0,
      quantity: 1,
    });

  const addFromItem = (item: Item) =>
    lines.append({
      itemId: item.id,
      description: `${item.name} (${item.sku})`,
      metal: item.metal,
      purity: item.purity,
      netWeightGram: item.netWeightGram,
      ratePerGram: latestRate(rates.data, item.metal, item.purity),
      makingType: item.makingType,
      makingRate: item.makingRate,
      wastagePercent: item.wastagePercent,
      quantity: 1,
    });

  const onSubmit = (values: CreateInvoiceInput) =>
    createInvoice.mutate(values, {
      onSuccess: (inv) => navigate(`/billing/invoices/${inv.id}`),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Build a sale bill — items, making charges, GST and old-gold exchange.
          </p>
        </div>
        <Button type="submit" disabled={createInvoice.isPending}>
          {createInvoice.isPending ? 'Saving…' : 'Save invoice'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer & tax</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="customerId">Customer</Label>
                <select id="customerId" className={selectClass} {...register('customerId')}>
                  <option value="">Select…</option>
                  {customers.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
                </select>
                {formState.errors.customerId && (
                  <p className="text-xs text-destructive">
                    {formState.errors.customerId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cgstPercent">CGST %</Label>
                <Input id="cgstPercent" type="number" step="0.001" {...register('cgstPercent')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sgstPercent">SGST %</Label>
                <Input id="sgstPercent" type="number" step="0.001" {...register('sgstPercent')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Line items</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  className="h-9 w-44"
                  placeholder="Scan barcode (SKU)…"
                  value={scan}
                  onChange={(e) => setScan(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      scanAdd(scan);
                    }
                  }}
                />
                <select
                  className={`${selectClass} max-w-52`}
                  value=""
                  onChange={(e) => {
                    const item = inStock.find((i) => i.id === e.target.value);
                    if (item) addFromItem(item);
                  }}
                >
                  <option value="">Add from stock…</option>
                  {inStock.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.sku} · {i.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={addBlankLine}>
                  <Plus className="size-4" /> Blank
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scanMsg && (
                <p className="mb-3 text-sm text-destructive">{scanMsg}</p>
              )}
              {lines.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Scan a barcode, add from stock, or add a blank line to begin.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-1 pr-2 font-medium">Description</th>
                        <th className="py-1 pr-2 font-medium">Metal</th>
                        <th className="py-1 pr-2 font-medium">Purity</th>
                        <th className="py-1 pr-2 font-medium">Net g</th>
                        <th className="py-1 pr-2 font-medium">Rate/g</th>
                        <th className="py-1 pr-2 font-medium">Making</th>
                        <th className="py-1 pr-2 font-medium">Rate</th>
                        <th className="py-1 pr-2 font-medium">Wst%</th>
                        <th className="py-1 pr-2 font-medium">Qty</th>
                        <th className="py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.fields.map((field, i) => (
                        <tr key={field.id} className="border-b last:border-0">
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} min-w-40`} {...register(`lines.${i}.description`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <select className={selectClass} {...register(`lines.${i}.metal`)}>
                              <option value={MetalType.GOLD}>Gold</option>
                              <option value={MetalType.SILVER}>Silver</option>
                              <option value={MetalType.PLATINUM}>Platinum</option>
                            </select>
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-16`} {...register(`lines.${i}.purity`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-20`} type="number" step="0.001" {...register(`lines.${i}.netWeightGram`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-24`} type="number" step="0.001" {...register(`lines.${i}.ratePerGram`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <select className={selectClass} {...register(`lines.${i}.makingType`)}>
                              <option value={MakingChargeType.PER_GRAM}>/g</option>
                              <option value={MakingChargeType.FIXED}>Fixed</option>
                              <option value={MakingChargeType.PERCENT}>%</option>
                            </select>
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-20`} type="number" step="0.001" {...register(`lines.${i}.makingRate`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-16`} type="number" step="0.001" {...register(`lines.${i}.wastagePercent`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-14`} type="number" step="1" {...register(`lines.${i}.quantity`)} />
                          </td>
                          <td className="py-1 text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => lines.remove(i)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {formState.errors.lines?.message && (
                <p className="mt-2 text-xs text-destructive">
                  {formState.errors.lines.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Old gold / exchange</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  oldGold.append({
                    description: '',
                    metal: MetalType.GOLD,
                    grossWeightGram: 0,
                    deductionPercent: 0,
                    ratePerGram: 0,
                  })
                }
              >
                <Plus className="size-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {oldGold.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Optional — metal taken in exchange, deducted from the total.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-1 pr-2 font-medium">Description</th>
                        <th className="py-1 pr-2 font-medium">Metal</th>
                        <th className="py-1 pr-2 font-medium">Gross g</th>
                        <th className="py-1 pr-2 font-medium">Deduct %</th>
                        <th className="py-1 pr-2 font-medium">Rate/g</th>
                        <th className="py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {oldGold.fields.map((field, i) => (
                        <tr key={field.id} className="border-b last:border-0">
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} min-w-40`} {...register(`oldGold.${i}.description`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <select className={selectClass} {...register(`oldGold.${i}.metal`)}>
                              <option value={MetalType.GOLD}>Gold</option>
                              <option value={MetalType.SILVER}>Silver</option>
                              <option value={MetalType.PLATINUM}>Platinum</option>
                            </select>
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-24`} type="number" step="0.001" {...register(`oldGold.${i}.grossWeightGram`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-20`} type="number" step="0.001" {...register(`oldGold.${i}.deductionPercent`)} />
                          </td>
                          <td className="py-1 pr-2">
                            <Input className={`${cellInput} w-24`} type="number" step="0.001" {...register(`oldGold.${i}.ratePerGram`)} />
                          </td>
                          <td className="py-1 text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => oldGold.remove(i)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-0">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Totals control={control} />
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" placeholder="optional" {...register('notes')} />
              </div>
              {createInvoice.isError && (
                <p className="text-sm text-destructive">
                  {(createInvoice.error as Error).message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? 'Saving…' : 'Save invoice'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
