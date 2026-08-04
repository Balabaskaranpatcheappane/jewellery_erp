import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@erp/shared';
import { Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLogin } from '@/features/auth/useLogin';
import { useAuthStore } from '@/store/auth';
import { fingerprintSupported, loginWithFingerprint } from '@/features/auth/webauthn';

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [fpBusy, setFpBusy] = useState(false);
  const [fpError, setFpError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginInput) =>
    login.mutate(values, {
      onSuccess: () => navigate('/', { replace: true }),
    });

  const onFingerprint = async () => {
    const email = watch('email').trim();
    if (!email) {
      setFpError('Enter your email first, then use fingerprint');
      return;
    }
    setFpBusy(true);
    setFpError(null);
    try {
      const res = await loginWithFingerprint(email);
      setSession(res.accessToken, res.user);
      navigate('/', { replace: true });
    } catch (e) {
      setFpError((e as Error).message || 'Fingerprint login failed');
    } finally {
      setFpBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Jewelry ERP</CardTitle>
          <CardDescription>Sign in to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@jewelry.local"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {login.isError && (
              <p className="text-sm text-destructive">
                {(login.error as Error).message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {fingerprintSupported() && (
            <div className="mt-4 space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={fpBusy}
                onClick={() => void onFingerprint()}
              >
                <Fingerprint className="size-4" />
                {fpBusy ? 'Waiting for fingerprint…' : 'Login with fingerprint'}
              </Button>
              {fpError && <p className="text-xs text-destructive">{fpError}</p>}
              <p className="text-center text-xs text-muted-foreground">
                Enrol first in Settings → Security while signed in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
