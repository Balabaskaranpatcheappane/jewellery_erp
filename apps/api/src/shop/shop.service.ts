import { Injectable } from '@nestjs/common';
import type { ShopProfile, UpdateShopProfileInput } from '@erp/shared';
import { PrismaService } from '../prisma/prisma.service';

const SHOP_ID = 'default';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<ShopProfile> {
    const row = await this.prisma.shopProfile.upsert({
      where: { id: SHOP_ID },
      update: {},
      create: { id: SHOP_ID },
    });
    return {
      name: row.name,
      address: row.address,
      phone: row.phone,
      gstin: row.gstin,
    };
  }

  async update(input: UpdateShopProfileInput): Promise<ShopProfile> {
    const row = await this.prisma.shopProfile.upsert({
      where: { id: SHOP_ID },
      update: {
        name: input.name,
        address: input.address ? input.address : null,
        phone: input.phone ? input.phone : null,
        gstin: input.gstin ? input.gstin : null,
      },
      create: {
        id: SHOP_ID,
        name: input.name,
        address: input.address ? input.address : null,
        phone: input.phone ? input.phone : null,
        gstin: input.gstin ? input.gstin : null,
      },
    });
    return {
      name: row.name,
      address: row.address,
      phone: row.phone,
      gstin: row.gstin,
    };
  }
}
