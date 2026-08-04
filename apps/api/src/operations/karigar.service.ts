import { Injectable } from '@nestjs/common';
import type { CreateKarigarInput, Karigar } from '@erp/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KarigarService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Karigar[]> {
    const rows = await this.prisma.karigar.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { jobs: { where: { status: 'ISSUED' } } } } },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      specialization: r.specialization,
      isActive: r.isActive,
      openJobs: r._count.jobs,
    }));
  }

  async create(input: CreateKarigarInput): Promise<Karigar> {
    const r = await this.prisma.karigar.create({
      data: {
        name: input.name,
        phone: input.phone ? input.phone : null,
        specialization: input.specialization ? input.specialization : null,
      },
    });
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      specialization: r.specialization,
      isActive: r.isActive,
      openJobs: 0,
    };
  }
}
