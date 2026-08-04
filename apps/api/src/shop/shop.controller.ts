import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { updateShopProfileSchema, UserRole } from '@erp/shared';
import type { UpdateShopProfileInput, ShopProfile } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ShopService } from './shop.service';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get()
  get(): Promise<ShopProfile> {
    return this.shop.get();
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Body(new ZodValidationPipe(updateShopProfileSchema)) body: UpdateShopProfileInput,
  ): Promise<ShopProfile> {
    return this.shop.update(body);
  }
}
