import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { createMetalRateSchema } from '@erp/shared';
import type { CreateMetalRateInput, MetalRate, AuthUser } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RateMasterService } from './rate-master.service';

@Controller('rate-master')
@UseGuards(JwtAuthGuard)
export class RateMasterController {
  constructor(private readonly rateMaster: RateMasterService) {}

  @Get()
  list(): Promise<MetalRate[]> {
    return this.rateMaster.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createMetalRateSchema)) body: CreateMetalRateInput,
    @CurrentUser() user: AuthUser,
  ): Promise<MetalRate> {
    return this.rateMaster.create(body, user.id);
  }
}
