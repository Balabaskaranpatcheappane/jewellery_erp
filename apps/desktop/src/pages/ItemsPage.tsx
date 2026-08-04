import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createItemSchema,
  MakingChargeType,
  MetalType,
  type CreateItemInput,
} from '@erp/shared';
import { Barcode, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { openReport, saveReport } from '@/lib/download';
import {
  useCategories,
  useCreateItem,
  useDeleteItem,
  useItems,
} from '@/features/inventory/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const statusStyles: Record<string, string> = {
  IN_STOCK: 'text-emerald-500',
  RESERVED: 'text-amber-500',
  SOLD: 'text-muted-foreground',
};

export function ItemsPage() {
  const items = useItems();
  const categories = useCategories();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      sku: '',
      name: '',
      categoryId: '',
      metal: MetalType.GOLD,
      purity: '916',
      grossWeightGram: 0,
      stoneWeightGram: 0,
      makingType: MakingChargeType.PER_GRAM,
      makingRate: 0,
      wastagePercent: 0,
      huid: '',
      quantity: 1,
    },
  });

  const onSubmit = (values: CreateItemInput) =>
    createItem.mutate(values, { onSuccess: () => reset() });

  const noCategories = !categories.isLoading && (categories.data?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Stock items by weight — gross, stone and net grams, purity, HUID
            hallmark and making charges.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void saveReport('/reports/inventory.xlsx', 'inventory.xlsx')}
        >
          <Download className="size-4" /> Excel
        </Button>
      </div>

      {noCategories && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Create a category first (Inventory → Categories) before adding
            items.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add item</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6"
          >
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="R-0001" {...register('sku')} />
              {errors.sku && (
                <p className="text-xs text-destructive">{errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="22K Gold Ring"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                className={selectClass}
                {...register('categoryId')}
              >
                <option value="">Select…</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="metal">Metal</Label>
              <select id="metal" className={selectClass} {...register('metal')}>
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
              <Label htmlFor="grossWeightGram">Gross (g)</Label>
              <Input
                id="grossWeightGram"
                type="number"
                step="0.001"
                {...register('grossWeightGram')}
              />
              {errors.grossWeightGram && (
                <p className="text-xs text-destructive">
                  {errors.grossWeightGram.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stoneWeightGram">Stone (g)</Label>
              <Input
                id="stoneWeightGram"
                type="number"
                step="0.001"
                {...register('stoneWeightGram')}
              />
              {errors.stoneWeightGram && (
                <p className="text-xs text-destructive">
                  {errors.stoneWeightGram.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="makingType">Making type</Label>
              <select
                id="makingType"
                className={selectClass}
                {...register('makingType')}
              >
                <option value={MakingChargeType.PER_GRAM}>Per gram</option>
                <option value={MakingChargeType.FIXED}>Fixed</option>
                <option value={MakingChargeType.PERCENT}>Percent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="makingRate">Making rate</Label>
              <Input
                id="makingRate"
                type="number"
                step="0.001"
                {...register('makingRate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wastagePercent">Wastage %</Label>
              <Input
                id="wastagePercent"
                type="number"
                step="0.001"
                {...register('wastagePercent')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="huid">HUID</Label>
              <Input id="huid" placeholder="optional" {...register('huid')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Qty</Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                {...register('quantity')}
              />
            </div>
            <div className="flex items-end lg:col-span-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createItem.isPending || noCategories}
              >
                {createItem.isPending ? 'Saving…' : 'Add item'}
              </Button>
            </div>
          </form>
          {createItem.isError && (
            <p className="mt-3 text-sm text-destructive">
              {(createItem.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock</CardTitle>
        </CardHeader>
        <CardContent>
          {items.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.data && items.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">SKU</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Category</th>
                    <th className="py-2 pr-4 font-medium">Metal/Purity</th>
                    <th className="py-2 pr-4 text-right font-medium">Net (g)</th>
                    <th className="py-2 pr-4 text-right font-medium">Qty</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.data.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{it.sku}</td>
                      <td className="py-2 pr-4">{it.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {it.categoryName ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        {it.metal} · {it.purity}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {it.netWeightGram.toLocaleString('en-IN', {
                          minimumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {it.quantity}
                      </td>
                      <td
                        className={`py-2 pr-4 font-medium ${
                          statusStyles[it.status] ?? ''
                        }`}
                      >
                        {it.status}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Barcode label"
                          onClick={() => void openReport(`/reports/items/${it.id}/barcode.png`)}
                        >
                          <Barcode className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteItem.isPending}
                          title="Delete item"
                          onClick={() => deleteItem.mutate(it.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
