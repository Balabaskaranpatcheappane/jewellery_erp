import { Injectable } from '@nestjs/common';
import type { CreateMetalRateInput, MetalRate } from '@erp/shared';
import { PrismaService } from '../prisma/prisma.service';

type MetalRateRow = {
  id: string;
  metal: string;
  purity: string;
  ratePerGram: { toString(): string };
  effectiveDate: Date;
  createdAt: Date;
  createdBy: { name: string } | null;
};

function toDto(row: MetalRateRow): MetalRate {
  return {
    id: row.id,
    metal: row.metal as MetalRate['metal'],
    purity: row.purity,
    ratePerGram: Number(row.ratePerGram.toString()),
    effectiveDate: row.effectiveDate.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
    createdByName: row.createdBy?.name ?? null,
  };
}

@Injectable()
export class RateMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MetalRate[]> {
    const rows = await this.prisma.metalRate.findMany({
      orderBy: [{ effectiveDate: 'desc' }, { metal: 'asc' }, { purity: 'asc' }],
      include: { createdBy: { select: { name: true } } },
      take: 200,
    });
    return rows.map(toDto);
  }

  async create(
    input: CreateMetalRateInput,
    userId: string,
  ): Promise<MetalRate> {
    // Normalize to UTC midnight of the picked calendar date. Using local
    // setHours() here shifted the stored @db.Date by a day on non-UTC servers.
    const d = new Date(input.effectiveDate);
    const effectiveDate = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );

    const row = await this.prisma.metalRate.upsert({
      where: {
        metal_purity_effectiveDate: {
          metal: input.metal,
          purity: input.purity,
          effectiveDate,
        },
      },
      update: { ratePerGram: input.ratePerGram, createdById: userId },
      create: {
        metal: input.metal,
        purity: input.purity,
        ratePerGram: input.ratePerGram,
        effectiveDate,
        createdById: userId,
      },
      include: { createdBy: { select: { name: true } } },
    });
    return toDto(row);
  }
}
