import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inr, grams } from '@/lib/format';
import { useLoan, useAddRepayment, useCloseLoan } from '@/features/loans/api';

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loan = useLoan(id);
  const addRepayment = useAddRepayment();
  const closeLoan = useCloseLoan();
  const [amount, setAmount] = useState('');

  if (loan.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (loan.isError || !loan.data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/loans')}>
          <ArrowLeft className="size-4" /> Loans
        </Button>
        <p className="text-sm text-destructive">Loan not found.</p>
      </div>
    );
  }
  const l = loan.data;

  const stat = (label: string, value: string, accent?: string) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-semibold tabular-nums ${accent ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/loans')}>
          <ArrowLeft className="size-4" /> Loans
        </Button>
        {l.status === 'ACTIVE' && (
          <Button
            variant="outline"
            disabled={closeLoan.isPending}
            onClick={() => id && closeLoan.mutate(id)}
          >
            Close loan
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{l.loanNo}</h1>
        <p className="text-sm text-muted-foreground">
          {l.customerName ?? '—'} · {l.startDate} · {l.interestRatePercent}%/mo · {l.status}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stat('Principal', inr(l.principal))}
        {stat('Accrued interest', inr(l.accruedInterest))}
        {stat('Repaid', inr(l.totalRepaid), 'text-emerald-500')}
        {stat('Outstanding', inr(l.outstanding), l.outstanding > 0 ? 'text-amber-500' : 'text-muted-foreground')}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pledged items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 font-medium">Metal</th>
                  <th className="py-2 pr-4 text-right font-medium">Gross</th>
                  <th className="py-2 pr-4 text-right font-medium">Net</th>
                  <th className="py-2 pr-4 text-right font-medium">Est. value</th>
                </tr>
              </thead>
              <tbody>
                {l.items.map((it) => (
                  <tr key={it.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{it.description}</td>
                    <td className="py-2 pr-4">{it.metal} · {it.purity}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{grams(it.grossWeightGram)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{grams(it.netWeightGram)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{inr(it.estimatedValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repayments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {l.status === 'ACTIVE' && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Amount ₹</Label>
                <Input
                  className="h-8 w-32"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                disabled={addRepayment.isPending || !amount}
                onClick={() =>
                  id &&
                  addRepayment.mutate(
                    { id, input: { amount: Number(amount) } },
                    { onSuccess: () => setAmount('') },
                  )
                }
              >
                Add repayment
              </Button>
              {addRepayment.isError && (
                <span className="text-sm text-destructive">{(addRepayment.error as Error).message}</span>
              )}
            </div>
          )}
          {l.repayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Note</th>
                    <th className="py-2 pr-4 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {l.repayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{p.paidOn}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.note ?? '—'}</td>
                      <td className="py-2 pr-4 text-right font-medium tabular-nums">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No repayments yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
