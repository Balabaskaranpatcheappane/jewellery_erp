import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useActivateLicense } from '@/features/license/api';

export function ActivationScreen() {
  const activate = useActivateLicense();
  const [key, setKey] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="size-5 text-primary" /> Activate Jewelry ERP
          </CardTitle>
          <CardDescription>
            Enter the product key you received to activate this installation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Product key</Label>
            <textarea
              id="key"
              rows={4}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste your product key…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {activate.isError && (
            <p className="text-sm text-destructive">{(activate.error as Error).message}</p>
          )}
          <Button
            className="w-full"
            disabled={activate.isPending || key.trim().length < 10}
            onClick={() => activate.mutate(key.trim())}
          >
            {activate.isPending ? 'Activating…' : 'Activate'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Need a key? Contact your vendor. The app stays locked until activated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
