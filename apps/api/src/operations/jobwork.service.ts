import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type {
  CreateJobOrderInput,
  ReceiveJobOrderInput,
  JobOrder,
} from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type JobRow = Prisma.JobOrderGetPayload<{
  include: { karigar: { select: { name: true } } };
}>;

const num = (d: Prisma.Decimal | null): number | null => (d === null ? null : Number(d));

function toDto(r: JobRow): JobOrder {
  return {
    id: r.id,
    jobNo: r.jobNo,
    karigarId: r.karigarId,
    karigarName: r.karigar?.name ?? null,
    description: r.description,
    metal: r.metal,
    purity: r.purity,
    issuedWeightGram: Number(r.issuedWeightGram),
    expectedReturnDate: r.expectedReturnDate
      ? r.expectedReturnDate.toISOString().slice(0, 10)
      : null,
    status: r.status,
    receivedWeightGram: num(r.receivedWeightGram),
    wastageGram: num(r.wastageGram),
    makingAmount: num(r.makingAmount),
    notes: r.notes,
    issuedAt: r.issuedAt.toISOString(),
    receivedAt: r.receivedAt ? r.receivedAt.toISOString() : null,
  };
}

const INCLUDE = { karigar: { select: { name: true } } } as const;

@Injectable()
export class JobWorkService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<JobOrder[]> {
    const rows = await this.prisma.jobOrder.findMany({
      orderBy: { issuedAt: 'desc' },
      include: INCLUDE,
      take: 300,
    });
    return rows.map(toDto);
  }

  async create(input: CreateJobOrderInput): Promise<JobOrder> {
    const karigar = await this.prisma.karigar.findUnique({
      where: { id: input.karigarId },
    });
    if (!karigar) throw new BadRequestException('Karigar not found');

    const year = new Date().getFullYear();
    const created = await this.prisma.$transaction(async (tx) => {
      const count = await tx.jobOrder.count({
        where: { jobNo: { startsWith: `JOB-${year}-` } },
      });
      const jobNo = `JOB-${year}-${String(count + 1).padStart(5, '0')}`;
      return tx.jobOrder.create({
        data: {
          jobNo,
          karigarId: input.karigarId,
          description: input.description,
          metal: input.metal,
          purity: input.purity,
          issuedWeightGram: input.issuedWeightGram,
          expectedReturnDate: input.expectedReturnDate ?? null,
          notes: input.notes ? input.notes : null,
        },
        include: INCLUDE,
      });
    });
    return toDto(created);
  }

  async receive(id: string, input: ReceiveJobOrderInput): Promise<JobOrder> {
    const job = await this.prisma.jobOrder.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job order not found');
    if (job.status !== 'ISSUED') {
      throw new BadRequestException('Only issued jobs can be received');
    }
    const updated = await this.prisma.jobOrder.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedWeightGram: input.receivedWeightGram,
        wastageGram: input.wastageGram,
        makingAmount: input.makingAmount,
        receivedAt: new Date(),
      },
      include: INCLUDE,
    });
    return toDto(updated);
  }
}
