import { Injectable, ConflictException } from '@nestjs/common';
import type { CreateBranchInput, Branch } from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function toDto(r: Prisma.BranchGetPayload<object>): Branch {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    address: r.address,
    phone: r.phone,
    isActive: r.isActive,
  };
}

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Branch[]> {
    const rows = await this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toDto);
  }

  async create(input: CreateBranchInput): Promise<Branch> {
    try {
      const r = await this.prisma.branch.create({
        data: {
          name: input.name,
          code: input.code,
          address: input.address ? input.address : null,
          phone: input.phone ? input.phone : null,
        },
      });
      return toDto(r);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Branch code "${input.code}" already exists`);
      }
      throw e;
    }
  }
}
