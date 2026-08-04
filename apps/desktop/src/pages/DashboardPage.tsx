import { SalesPeriod } from '@erp/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inr } from '@/lib/format';
import { RevenueChart } from '@/components/RevenueChart';
import { useMetalRates } from '@/features/rate-master/api';
import { useSalesReport } from '@/features/reports/api';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(bucket: string): string {
  // bucket = "yyyy-mm"
  const [y, m] = bucket.split('-');
  const idx = Number(m) - 1;
  return `${MONTH_ABBR[idx] ?? m} ${y?.slice(2) ?? ''}`;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function DashboardPage() {
  const rates = useMetalRates();

  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setMonth(today.getMonth() - 11);
  yearAgo.setDate(1);
  const sales = useSalesReport(SalesPeriod.MONTHLY, iso(yearAgo), iso(today));

  const latestByMetal = new Map<string, number>();
  for (const r of rates.data ?? []) {
    const key = `${r.metal} ${r.purity}`;
    if (!latestByMetal.has(key)) latestByMetal.set(key, r.ratePerGram);
  }

  const chartData = (sales.data?.rows ?? []).map((r) => ({
    label: monthLabel(r.bucket),
    value: r.grandTotal,
  }));

  const totalRevenue = sales.data?.totals.grandTotal ?? 0;
  const totalInvoices = sales.data?.totals.invoiceCount ?? 0;
  const thisMonthKey = iso(today).slice(0, 7);
  const thisMonth =
    sales.data?.rows.find((r) => r.bucket === thisMonthKey)?.grandTotal ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Sales revenue and today&apos;s metal rates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (12 mo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{inr(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{inr(thisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoices (12 mo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{totalInvoices}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.isLoading ? (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <RevenueChart data={chartData} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s rates</CardTitle>
        </CardHeader>
        <CardContent>
          {latestByMetal.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rates yet — add them in Rate Master.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[...latestByMetal.entries()].map(([key, rate]) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">{key}</div>
                  <div className="text-xl font-semibold tabular-nums">
                    {inr(rate)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
