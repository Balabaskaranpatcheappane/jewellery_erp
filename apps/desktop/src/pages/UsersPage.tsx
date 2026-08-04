import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, UserRole, type CreateUserInput } from '@erp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { useUsers, useCreateUser, useSetUserActive } from '@/features/users/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const roleStyles: Record<string, string> = {
  ADMIN: 'text-amber-500',
  MANAGER: 'text-sky-500',
  CASHIER: 'text-muted-foreground',
};

export function UsersPage() {
  const me = useAuthStore((s) => s.user);
  const users = useUsers();
  const createUser = useCreateUser();
  const setActive = useSetUserActive();

  const { register, handleSubmit, reset, formState } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: UserRole.CASHIER },
  });

  if (me?.role !== 'ADMIN') {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Only administrators can manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">
          Create staff accounts and assign roles (Admin, Manager, Cashier).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add user</CardTitle>
          <CardDescription>
            Admin — full access · Manager — operations · Cashier — billing counter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => createUser.mutate(v, { onSuccess: () => reset() }))}
            className="grid grid-cols-1 gap-4 sm:grid-cols-5"
          >
            <div className="space-y-2">
              <Label htmlFor="uname">Name</Label>
              <Input id="uname" {...register('name')} />
              {formState.errors.name && (
                <p className="text-xs text-destructive">{formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="uemail">Email</Label>
              <Input id="uemail" type="email" autoComplete="off" {...register('email')} />
              {formState.errors.email && (
                <p className="text-xs text-destructive">{formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="upass">Password</Label>
              <Input id="upass" type="password" autoComplete="new-password" {...register('password')} />
              {formState.errors.password && (
                <p className="text-xs text-destructive">{formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="urole">Role</Label>
              <select id="urole" className={selectClass} {...register('role')}>
                <option value={UserRole.CASHIER}>Cashier</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </div>
          </form>
          {createUser.isError && (
            <p className="mt-3 text-sm text-destructive">{(createUser.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : users.data && users.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        {u.name}
                        {u.id === me?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className={`py-2 pr-4 font-medium ${roleStyles[u.role] ?? ''}`}>
                        {u.role}
                      </td>
                      <td className="py-2 pr-4">
                        {u.isActive ? (
                          <span className="text-emerald-500">Active</span>
                        ) : (
                          <span className="text-muted-foreground">Disabled</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={setActive.isPending || u.id === me?.id}
                          onClick={() =>
                            setActive.mutate({ id: u.id, isActive: !u.isActive })
                          }
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users.</p>
          )}
          {setActive.isError && (
            <p className="mt-3 text-sm text-destructive">{(setActive.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
