import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCustomerSchema, type CreateCustomerInput } from '@erp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomers, useCreateCustomer } from '@/features/customers/api';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const customers = useCustomers(search.trim() || undefined);
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      aadhaar: '',
      address: '',
      city: '',
    },
  });

  const onSubmit = (values: CreateCustomerInput) =>
    createCustomer.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Customer directory used for billing and tax invoices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" {...register('phone')} />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" placeholder="optional" {...register('gstin')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input id="pan" placeholder="ABCDE1234F (optional)" {...register('pan')} />
              {errors.pan && (
                <p className="text-xs text-destructive">{errors.pan.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar</Label>
              <Input id="aadhaar" placeholder="12 digits (optional)" {...register('aadhaar')} />
              {errors.aadhaar && (
                <p className="text-xs text-destructive">{errors.aadhaar.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} />
            </div>
            <div className="flex items-end sm:col-span-3">
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? 'Saving…' : 'Add customer'}
              </Button>
            </div>
          </form>
          {createCustomer.isError && (
            <p className="mt-3 text-sm text-destructive">
              {(createCustomer.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Directory</CardTitle>
          <Input
            placeholder="Search name or phone…"
            className="max-w-60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {customers.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : customers.data && customers.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">City</th>
                    <th className="py-2 pr-4 font-medium">GSTIN</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.data.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.name}</td>
                      <td className="py-2 pr-4 tabular-nums">{c.phone}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.city ?? '—'}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.gstin ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No customers found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
