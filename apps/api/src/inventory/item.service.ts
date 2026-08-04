import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { CreateItemInput, Item, ItemStatus } from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ItemRow = Prisma.ItemGetPayload<{
  include: { category: { select: { name: true } } };
}>;

function toDto(row: ItemRow): Item {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    metal: row.metal,
    purity: row.purity,
    grossWeightGram: Number(row.grossWeightGram),
    stoneWeightGram: Number(row.stoneWeightGram),
    netWeightGram: Number(row.netWeightGram),
    makingType: row.makingType,
    makingRate: Number(row.makingRate),
    wastagePercent: Number(row.wastagePercent),
    huid: row.huid,
    quantity: row.quantity,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: ItemStatus): Promise<Item[]> {
    const rows = await this.prisma.item.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } },
      take: 500,
    });
    return rows.map(toDto);
  }

  async create(input: CreateItemInput): Promise<Item> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) throw new BadRequestException('Category not found');

    const netWeightGram = input.grossWeightGram - input.stoneWeightGram;

    try {
      const row = await this.prisma.item.create({
        data: {
          sku: input.sku,
          name: input.name,
          categoryId: input.categoryId,
          metal: input.metal,
          purity: input.purity,
          grossWeightGram: input.grossWeightGram,
          stoneWeightGram: input.stoneWeightGram,
          netWeightGram,
          makingType: input.makingType,
          makingRate: input.makingRate,
          wastagePercent: input.wastagePercent,
          huid: input.huid ? input.huid : null,
          quantity: input.quantity,
        },
        include: { category: { select: { name: true } } },
      });
      return toDto(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`SKU "${input.sku}" already exists`);
      }
      throw e;
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.item.delete({ where: { id } });
    return { id };
  }
}
