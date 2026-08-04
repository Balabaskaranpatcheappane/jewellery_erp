import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { CreateCategoryInput, Category } from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CategoryRow = Prisma.ProductCategoryGetPayload<{
  include: { _count: { select: { items: true } } };
}>;

function toDto(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    hsnCode: row.hsnCode,
    defaultMakingType: row.defaultMakingType,
    defaultMakingRate: Number(row.defaultMakingRate),
    defaultWastagePercent: Number(row.defaultWastagePercent),
    itemCount: row._count.items,
  };
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Category[]> {
    const rows = await this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    return rows.map(toDto);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    try {
      const row = await this.prisma.productCategory.create({
        data: {
          name: input.name,
          code: input.code,
          hsnCode: input.hsnCode ? input.hsnCode : null,
          defaultMakingType: input.defaultMakingType,
          defaultMakingRate: input.defaultMakingRate,
          defaultWastagePercent: input.defaultWastagePercent,
        },
        include: { _count: { select: { items: true } } },
      });
      return toDto(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Category code "${input.code}" already exists`);
      }
      throw e;
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.items > 0) {
      throw new ConflictException(
        'Cannot delete a category that still has items',
      );
    }
    await this.prisma.productCategory.delete({ where: { id } });
    return { id };
  }
}
