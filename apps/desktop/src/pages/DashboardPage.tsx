import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMetalRates } from '@/features/rate-master/api';

export function DashboardPage() {
  const rates = useMetalRates();
  const latestByMetal = new Map<string, number>();
  for (const r of rates.data ?? []) {
    const key = `${r.metal} ${r.purity}`;
    if (!latestByMetal.has(key)) latestByMetal.set(key, r.ratePerGram);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 skeleton. Inventory, billing, customers and reports modules
          land in later phases.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...latestByMetal.entries()].map(([key, rate]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                ₹
                {rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  /g
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {latestByMetal.size === 0 && (
          <p className="text-sm text-muted-foreground">
            No rates yet — add them in Rate Master.
          </p>
        )}
      </div>
    </div>
  );
}
