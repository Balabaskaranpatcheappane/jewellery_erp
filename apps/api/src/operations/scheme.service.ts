import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type {
  CreateSchemeInput,
  AddInstallmentInput,
  Scheme,
} from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SchemeRow = Prisma.SavingSchemeGetPayload<{
  include: {
    customer: { select: { name: true } };
    installments: true;
  };
}>;

function toDto(r: SchemeRow): Scheme {
  const installments = [...r.installments].sort((a, b) => a.monthNo - b.monthNo);
  const paidTotal = installments.reduce((s, i) => s + Number(i.amount), 0);
  return {
    id: r.id,
    customerId: r.customerId,
    customerName: r.customer?.name ?? null,
    name: r.name,
    monthlyAmount: Number(r.monthlyAmount),
    durationMonths: r.durationMonths,
    startDate: r.startDate.toISOString().slice(0, 10),
    status: r.status,
    paidCount: installments.length,
    paidTotal: Math.round(paidTotal * 100) / 100,
    installments: installments.map((i) => ({
      id: i.id,
      monthNo: i.monthNo,
      amount: Number(i.amount),
      paidOn: i.paidOn.toISOString().slice(0, 10),
    })),
  };
}

const INCLUDE = {
  customer: { select: { name: true } },
  installments: true,
} as const;

@Injectable()
export class SchemeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Scheme[]> {
    const rows = await this.prisma.savingScheme.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE,
      take: 300,
    });
    return rows.map(toDto);
  }

  async get(id: string): Promise<Scheme> {
    const row = await this.prisma.savingScheme.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!row) throw new NotFoundException('Scheme not found');
    return toDto(row);
  }

  async create(input: CreateSchemeInput): Promise<Scheme> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) throw new BadRequestException('Customer not found');
    const row = await this.prisma.savingScheme.create({
      data: {
        customerId: input.customerId,
        name: input.name,
        monthlyAmount: input.monthlyAmount,
        durationMonths: input.durationMonths,
        startDate: input.startDate ?? new Date(),
      },
      include: INCLUDE,
    });
    return toDto(row);
  }

  async addInstallment(id: string, input: AddInstallmentInput): Promise<Scheme> {
    const scheme = await this.prisma.savingScheme.findUnique({
      where: { id },
      include: { installments: true },
    });
    if (!scheme) throw new NotFoundException('Scheme not found');
    if (scheme.status !== 'ACTIVE') {
      throw new BadRequestException('Scheme is not active');
    }
    const monthNo = scheme.installments.length + 1;
    if (monthNo > scheme.durationMonths) {
      throw new BadRequestException('All installments already paid');
    }
    const completed = monthNo === scheme.durationMonths;

    await this.prisma.$transaction([
      this.prisma.schemeInstallment.create({
        data: {
          schemeId: id,
          monthNo,
          amount: input.amount,
          paidOn: input.paidOn ?? new Date(),
        },
      }),
      this.prisma.savingScheme.update({
        where: { id },
        data: completed ? { status: 'COMPLETED' } : {},
      }),
    ]);
    return this.get(id);
  }
}
