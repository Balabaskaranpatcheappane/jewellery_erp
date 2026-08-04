import { useState } from 'react';
import { SalesPeriod, type SalesPeriod as Period } from '@erp/shared';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { inr } from '@/lib/format';
import { saveReport } from '@/lib/download';
import { useSalesReport, salesQuery } from '@/features/reports/api';

const periods: { value: Period; label: string }[] = [
  { value: SalesPeriod.DAILY, label: 'Daily' },
  { value: SalesPeriod.WEEKLY, label: 'Weekly' },
  { value: SalesPeriod.MONTHLY, label: 'Monthly' },
  { value: SalesPeriod.YEARLY, label: 'Yearly' },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function SalesReportPage() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);

  const [period, setPeriod] = useState<Period>(SalesPeriod.DAILY);
  const [from, setFrom] = useState(iso(monthAgo));
  const [to, setTo] = useState(iso(today));

  const report = useSalesReport(period, from, to);
  const totals = report.data?.totals;

  const tile = (label: string, value: string) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales Report</h1>
          <p className="text-sm text-muted-foreground">
            Sales totals rolled up by day, week, month or year.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            void saveReport(
              `/reports/sales.xlsx${salesQuery(period, from, to)}`,
              `sales-${period}.xlsx`,
            )
          }
        >
          <Download className="size-4" /> Excel
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex rounded-md border p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'rounded px-3 py-1 text-sm font-medium transition-colors',
                  period === p.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" className="h-9 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" className="h-9 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tile('Invoices', String(totals?.invoiceCount ?? 0))}
        {tile('Subtotal', inr(totals?.subtotal ?? 0))}
        {tile('Tax (GST)', inr(totals?.tax ?? 0))}
        {tile('Grand total', inr(totals?.grandTotal ?? 0))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {report.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : report.data && report.data.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Period</th>
                    <th className="py-2 pr-4 text-right font-medium">Invoices</th>
                    <th className="py-2 pr-4 text-right font-medium">Subtotal</th>
                    <th className="py-2 pr-4 text-right font-medium">Tax</th>
                    <th className="py-2 pr-4 text-right font-medium">Old gold</th>
                    <th className="py-2 pr-4 text-right font-medium">Grand total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.rows.map((r) => (
                    <tr key={r.bucket} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{r.label}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.invoiceCount}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{inr(r.subtotal)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{inr(r.tax)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{inr(r.oldGold)}</td>
                      <td className="py-2 pr-4 text-right font-medium tabular-nums">{inr(r.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{totals?.invoiceCount ?? 0}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(totals?.subtotal ?? 0)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(totals?.tax ?? 0)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(totals?.oldGold ?? 0)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(totals?.grandTotal ?? 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sales in this range.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
