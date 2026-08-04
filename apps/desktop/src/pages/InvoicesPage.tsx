import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { inr } from '@/lib/format';
import { saveReport } from '@/lib/download';
import { useInvoices } from '@/features/billing/api';

const statusStyles: Record<string, string> = {
  DRAFT: 'text-muted-foreground',
  FINALIZED: 'text-emerald-500',
  PAID: 'text-sky-500',
  CANCELLED: 'text-destructive',
};

export function InvoicesPage() {
  const invoices = useInvoices();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Sales bills and tax invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void saveReport('/reports/invoices.xlsx', 'invoices.xlsx')}
          >
            <Download className="size-4" /> Excel
          </Button>
          <Button onClick={() => navigate('/billing/new')}>
            <Plus className="size-4" /> New Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {invoices.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : invoices.data && invoices.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Invoice #</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Customer</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 text-right font-medium">Grand total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.data.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-accent/50"
                      onClick={() => navigate(`/billing/invoices/${inv.id}`)}
                    >
                      <td className="py-2 pr-4 font-medium">
                        <Link to={`/billing/invoices/${inv.id}`} className="hover:underline">
                          {inv.invoiceNo}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{inv.invoiceDate}</td>
                      <td className="py-2 pr-4">{inv.customerName ?? '—'}</td>
                      <td className={`py-2 pr-4 font-medium ${statusStyles[inv.status] ?? ''}`}>
                        {inv.status}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {inr(inv.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No invoices yet. Create your first one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
