import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createKarigarSchema,
  createJobOrderSchema,
  MetalType,
  type CreateKarigarInput,
  type CreateJobOrderInput,
  type JobOrder,
} from '@erp/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { grams, inr } from '@/lib/format';
import {
  useKarigars,
  useCreateKarigar,
  useJobOrders,
  useCreateJobOrder,
  useReceiveJobOrder,
} from '@/features/operations/api';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

function KarigarForm() {
  const create = useCreateKarigar();
  const { register, handleSubmit, reset, formState } = useForm<CreateKarigarInput>({
    resolver: zodResolver(createKarigarSchema),
    defaultValues: { name: '', phone: '', specialization: '' },
  });
  return (
    <form
      onSubmit={handleSubmit((v) => create.mutate(v, { onSuccess: () => reset() }))}
      className="grid grid-cols-1 gap-4 sm:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="kname">Name</Label>
        <Input id="kname" {...register('name')} />
        {formState.errors.name && (
          <p className="text-xs text-destructive">{formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="kphone">Phone</Label>
        <Input id="kphone" {...register('phone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kspec">Specialization</Label>
        <Input id="kspec" placeholder="Chains, settings…" {...register('specialization')} />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={create.isPending}>
          Add karigar
        </Button>
      </div>
    </form>
  );
}

function ReceivePanel({ job, onDone }: { job: JobOrder; onDone: () => void }) {
  const receive = useReceiveJobOrder();
  const [received, setReceived] = useState(String(job.issuedWeightGram));
  const [wastage, setWastage] = useState('0');
  const [making, setMaking] = useState('0');
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
      <div className="space-y-1">
        <Label className="text-xs">Received g</Label>
        <Input className="h-8 w-24" type="number" step="0.001" value={received} onChange={(e) => setReceived(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Wastage g</Label>
        <Input className="h-8 w-24" type="number" step="0.001" value={wastage} onChange={(e) => setWastage(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Making ₹</Label>
        <Input className="h-8 w-28" type="number" step="0.01" value={making} onChange={(e) => setMaking(e.target.value)} />
      </div>
      <Button
        size="sm"
        disabled={receive.isPending}
        onClick={() =>
          receive.mutate(
            {
              id: job.id,
              input: {
                receivedWeightGram: Number(received),
                wastageGram: Number(wastage),
                makingAmount: Number(making),
              },
            },
            { onSuccess: onDone },
          )
        }
      >
        Confirm
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        Cancel
      </Button>
    </div>
  );
}

export function JobWorkPage() {
  const karigars = useKarigars();
  const jobs = useJobOrders();
  const createJob = useCreateJobOrder();
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<CreateJobOrderInput>({
    resolver: zodResolver(createJobOrderSchema),
    defaultValues: {
      karigarId: '',
      description: '',
      metal: MetalType.GOLD,
      purity: '916',
      issuedWeightGram: 0,
      notes: '',
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Work</h1>
        <p className="text-sm text-muted-foreground">
          Issue metal to karigars and reconcile what comes back.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Karigars</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <KarigarForm />
          {karigars.data && karigars.data.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm">
              {karigars.data.map((k) => (
                <span key={k.id} className="rounded-md border px-2 py-1">
                  {k.name}
                  {k.openJobs > 0 && (
                    <span className="ml-1 text-amber-500">· {k.openJobs} open</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue job</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => createJob.mutate(v, { onSuccess: () => reset() }))}
            className="grid grid-cols-2 gap-4 sm:grid-cols-6"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jkarigar">Karigar</Label>
              <select id="jkarigar" className={selectClass} {...register('karigarId')}>
                <option value="">Select…</option>
                {karigars.data?.map((k) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
              {formState.errors.karigarId && (
                <p className="text-xs text-destructive">{formState.errors.karigarId.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jdesc">Description</Label>
              <Input id="jdesc" {...register('description')} />
              {formState.errors.description && (
                <p className="text-xs text-destructive">{formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jmetal">Metal</Label>
              <select id="jmetal" className={selectClass} {...register('metal')}>
                <option value={MetalType.GOLD}>Gold</option>
                <option value={MetalType.SILVER}>Silver</option>
                <option value={MetalType.PLATINUM}>Platinum</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jpurity">Purity</Label>
              <Input id="jpurity" {...register('purity')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jweight">Issued g</Label>
              <Input id="jweight" type="number" step="0.001" {...register('issuedWeightGram')} />
              {formState.errors.issuedWeightGram && (
                <p className="text-xs text-destructive">{formState.errors.issuedWeightGram.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="jnotes">Notes</Label>
              <Input id="jnotes" {...register('notes')} />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" className="w-full" disabled={createJob.isPending}>
                Issue job
              </Button>
            </div>
          </form>
          {createJob.isError && (
            <p className="mt-3 text-sm text-destructive">{(createJob.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job orders</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : jobs.data && jobs.data.length > 0 ? (
            <div className="space-y-3">
              {jobs.data.map((j) => (
                <div key={j.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-medium">{j.jobNo}</span> · {j.karigarName} ·{' '}
                      {j.description}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {j.metal} {j.purity} · issued {grams(j.issuedWeightGram)}
                      </span>
                      {j.status === 'ISSUED' ? (
                        <Button size="sm" variant="outline" onClick={() => setReceivingId(j.id)}>
                          Receive
                        </Button>
                      ) : (
                        <span className="font-medium text-emerald-500">
                          {j.status}
                          {j.receivedWeightGram != null &&
                            ` · ${grams(j.receivedWeightGram)}`}
                          {j.makingAmount != null && ` · ${inr(j.makingAmount)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {receivingId === j.id && (
                    <div className="mt-3">
                      <ReceivePanel job={j} onDone={() => setReceivingId(null)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No job orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
