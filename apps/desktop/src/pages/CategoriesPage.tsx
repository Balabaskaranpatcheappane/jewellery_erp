import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCategorySchema,
  MakingChargeType,
  type CreateCategoryInput,
} from '@erp/shared';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from '@/features/inventory/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function CategoriesPage() {
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      code: '',
      hsnCode: '',
      defaultMakingType: MakingChargeType.PER_GRAM,
      defaultMakingRate: 0,
      defaultWastagePercent: 0,
    },
  });

  const onSubmit = (values: CreateCategoryInput) =>
    createCategory.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Product groups with default making-charge and wastage settings that
          new items inherit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-6"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Gold Rings" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="GRING" {...register('code')} />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN</Label>
              <Input id="hsnCode" placeholder="7113" {...register('hsnCode')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultMakingType">Making type</Label>
              <select
                id="defaultMakingType"
                className={selectClass}
                {...register('defaultMakingType')}
              >
                <option value={MakingChargeType.PER_GRAM}>Per gram</option>
                <option value={MakingChargeType.FIXED}>Fixed</option>
                <option value={MakingChargeType.PERCENT}>Percent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultMakingRate">Making rate</Label>
              <Input
                id="defaultMakingRate"
                type="number"
                step="0.001"
                {...register('defaultMakingRate')}
              />
            </div>
            <div className="space-y-2 sm:col-span-5">
              <Label htmlFor="defaultWastagePercent">Wastage %</Label>
              <Input
                id="defaultWastagePercent"
                type="number"
                step="0.001"
                className="sm:max-w-40"
                {...register('defaultWastagePercent')}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={createCategory.isPending}
              >
                {createCategory.isPending ? 'Saving…' : 'Add'}
              </Button>
            </div>
          </form>
          {createCategory.isError && (
            <p className="mt-3 text-sm text-destructive">
              {(createCategory.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : categories.data && categories.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Code</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">HSN</th>
                    <th className="py-2 pr-4 font-medium">Making</th>
                    <th className="py-2 pr-4 text-right font-medium">Wastage %</th>
                    <th className="py-2 pr-4 text-right font-medium">Items</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {categories.data.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.code}</td>
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.hsnCode ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        {c.defaultMakingType} · {c.defaultMakingRate}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {c.defaultWastagePercent}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {c.itemCount}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={c.itemCount > 0 || deleteCategory.isPending}
                          title={
                            c.itemCount > 0
                              ? 'Category has items'
                              : 'Delete category'
                          }
                          onClick={() => deleteCategory.mutate(c.id)}
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
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
