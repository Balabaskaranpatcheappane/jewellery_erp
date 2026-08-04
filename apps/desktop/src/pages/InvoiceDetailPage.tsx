import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inr, grams } from '@/lib/format';
import { openReport } from '@/lib/download';
import { useInvoice } from '@/features/billing/api';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = useInvoice(id);

  if (invoice.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (invoice.isError || !invoice.data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/billing')}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <p className="text-sm text-destructive">Invoice not found.</p>
      </div>
    );
  }

  const inv = invoice.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/billing')}>
          <ArrowLeft className="size-4" /> Invoices
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{inv.status}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void openReport(`/reports/invoices/${inv.id}/pdf`)}
          >
            <Printer className="size-4" /> PDF / Print
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{inv.invoiceNo}</h1>
        <p className="text-sm text-muted-foreground">
          {inv.customerName ?? '—'} · {inv.invoiceDate}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 font-medium">Metal</th>
                  <th className="py-2 pr-4 text-right font-medium">Net</th>
                  <th className="py-2 pr-4 text-right font-medium">Rate/g</th>
                  <th className="py-2 pr-4 text-right font-medium">Metal</th>
                  <th className="py-2 pr-4 text-right font-medium">Making</th>
                  <th className="py-2 pr-4 text-right font-medium">Wastage</th>
                  <th className="py-2 pr-4 text-right font-medium">Qty</th>
                  <th className="py-2 pr-4 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{l.description}</td>
                    <td className="py-2 pr-4">{l.metal} · {l.purity}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{grams(l.netWeightGram)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(l.ratePerGram)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(l.metalValue)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(l.makingAmount)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(l.wastageAmount)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.quantity}</td>
                    <td className="py-2 pr-4 text-right font-medium tabular-nums">{inr(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {inv.oldGoldLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Old gold / exchange</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Description</th>
                    <th className="py-2 pr-4 font-medium">Metal</th>
                    <th className="py-2 pr-4 text-right font-medium">Gross</th>
                    <th className="py-2 pr-4 text-right font-medium">Deduct %</th>
                    <th className="py-2 pr-4 text-right font-medium">Rate/g</th>
                    <th className="py-2 pr-4 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.oldGoldLines.map((g) => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{g.description}</td>
                      <td className="py-2 pr-4">{g.metal}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{grams(g.grossWeightGram)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{g.deductionPercent}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{inr(g.ratePerGram)}</td>
                      <td className="py-2 pr-4 text-right font-medium tabular-nums">- {inr(g.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-1.5 pt-6">
            <Row label="Subtotal" value={inr(inv.subtotal)} />
            <Row label={`CGST (${inv.cgstPercent}%)`} value={inr(inv.cgst)} />
            <Row label={`SGST (${inv.sgstPercent}%)`} value={inr(inv.sgst)} />
            {inv.oldGoldValue > 0 && <Row label="Old gold" value={`- ${inr(inv.oldGoldValue)}`} />}
            {inv.roundOff !== 0 && <Row label="Round off" value={inr(inv.roundOff)} />}
            <div className="my-1 border-t" />
            <Row label="Grand total" value={inr(inv.grandTotal)} strong />
          </CardContent>
        </Card>
      </div>

      {inv.notes && (
        <p className="text-sm text-muted-foreground">Notes: {inv.notes}</p>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-base font-semibold' : 'text-sm'}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
