import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  computeLoan,
  type CreateLoanInput,
  type AddRepaymentInput,
  type Loan,
  type LoanSummary,
} from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LoanRow = Prisma.LoanGetPayload<{
  include: {
    customer: { select: { name: true } };
    items: true;
    repayments: true;
  };
}>;

const num = (d: Prisma.Decimal): number => Number(d);

function toDto(r: LoanRow): Loan {
  const totalRepaid =
    Math.round(r.repayments.reduce((s, p) => s + Number(p.amount), 0) * 100) / 100;
  const comp = computeLoan({
    principal: num(r.principal),
    interestRatePercent: num(r.interestRatePercent),
    startDate: r.startDate,
    totalRepaid,
  });
  return {
    id: r.id,
    loanNo: r.loanNo,
    customerId: r.customerId,
    customerName: r.customer?.name ?? null,
    principal: num(r.principal),
    interestRatePercent: num(r.interestRatePercent),
    startDate: r.startDate.toISOString().slice(0, 10),
    dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    totalRepaid,
    accruedInterest: comp.accruedInterest,
    outstanding: r.status === 'CLOSED' ? 0 : comp.outstanding,
    items: r.items.map((i) => ({
      id: i.id,
      description: i.description,
      metal: i.metal,
      purity: i.purity,
      grossWeightGram: num(i.grossWeightGram),
      netWeightGram: num(i.netWeightGram),
      estimatedValue: num(i.estimatedValue),
    })),
    repayments: [...r.repayments]
      .sort((a, b) => a.paidOn.getTime() - b.paidOn.getTime())
      .map((p) => ({
        id: p.id,
        amount: num(p.amount),
        paidOn: p.paidOn.toISOString().slice(0, 10),
        note: p.note,
      })),
  };
}

const INCLUDE = {
  customer: { select: { name: true } },
  items: true,
  repayments: true,
} as const;

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<LoanSummary[]> {
    const rows = await this.prisma.loan.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE,
      take: 300,
    });
    return rows.map((r) => {
      const dto = toDto(r);
      return {
        id: dto.id,
        loanNo: dto.loanNo,
        customerName: dto.customerName,
        principal: dto.principal,
        interestRatePercent: dto.interestRatePercent,
        startDate: dto.startDate,
        status: dto.status,
        outstanding: dto.outstanding,
      };
    });
  }

  async get(id: string): Promise<Loan> {
    const row = await this.prisma.loan.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Loan not found');
    return toDto(row);
  }

  async create(input: CreateLoanInput, userId: string): Promise<Loan> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    const startDate = input.startDate ?? new Date();
    const year = startDate.getFullYear();

    const created = await this.prisma.$transaction(async (tx) => {
      const count = await tx.loan.count({
        where: { loanNo: { startsWith: `LOAN-${year}-` } },
      });
      const loanNo = `LOAN-${year}-${String(count + 1).padStart(5, '0')}`;
      return tx.loan.create({
        data: {
          loanNo,
          customerId: input.customerId,
          principal: input.principal,
          interestRatePercent: input.interestRatePercent,
          startDate,
          dueDate: input.dueDate ?? null,
          notes: input.notes ? input.notes : null,
          createdById: userId,
          items: {
            create: input.items.map((i) => ({
              description: i.description,
              metal: i.metal,
              purity: i.purity,
              grossWeightGram: i.grossWeightGram,
              netWeightGram: i.netWeightGram,
              estimatedValue: i.estimatedValue,
            })),
          },
        },
        include: INCLUDE,
      });
    });
    return toDto(created);
  }

  async addRepayment(id: string, input: AddRepaymentInput): Promise<Loan> {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException('Loan is not active');
    }
    await this.prisma.loanRepayment.create({
      data: {
        loanId: id,
        amount: input.amount,
        paidOn: input.paidOn ?? new Date(),
        note: input.note ? input.note : null,
      },
    });
    return this.get(id);
  }

  async close(id: string): Promise<Loan> {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException('Loan not found');
    await this.prisma.loan.update({ where: { id }, data: { status: 'CLOSED' } });
    return this.get(id);
  }
}
