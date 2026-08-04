import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBranchSchema, type CreateBranchInput } from '@erp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBranches, useCreateBranch } from '@/features/operations/api';

export function BranchesPage() {
  const branches = useBranches();
  const createBranch = useCreateBranch();
  const { register, handleSubmit, reset, formState } = useForm<CreateBranchInput>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: { name: '', code: '', address: '', phone: '' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Branches</h1>
        <p className="text-sm text-muted-foreground">Shop locations for multi-branch operations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add branch</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => createBranch.mutate(v, { onSuccess: () => reset() }))}
            className="grid grid-cols-1 gap-4 sm:grid-cols-4"
          >
            <div className="space-y-2">
              <Label htmlFor="bname">Name</Label>
              <Input id="bname" {...register('name')} />
              {formState.errors.name && (
                <p className="text-xs text-destructive">{formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bcode">Code</Label>
              <Input id="bcode" placeholder="MAIN" {...register('code')} />
              {formState.errors.code && (
                <p className="text-xs text-destructive">{formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bphone">Phone</Label>
              <Input id="bphone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baddr">Address</Label>
              <Input id="baddr" {...register('address')} />
            </div>
            <div className="flex items-end sm:col-span-4">
              <Button type="submit" disabled={createBranch.isPending}>Add branch</Button>
            </div>
          </form>
          {createBranch.isError && (
            <p className="mt-3 text-sm text-destructive">{(createBranch.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All branches</CardTitle>
        </CardHeader>
        <CardContent>
          {branches.data && branches.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Code</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.data.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{b.code}</td>
                      <td className="py-2 pr-4">{b.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{b.phone ?? '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{b.address ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No branches yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
