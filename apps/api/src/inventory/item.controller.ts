import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { createItemSchema, ItemStatus } from '@erp/shared';
import type { CreateItemInput, Item } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ItemService } from './item.service';

@Controller('inventory/items')
@UseGuards(JwtAuthGuard)
export class ItemController {
  constructor(private readonly items: ItemService) {}

  @Get()
  list(@Query('status') status?: string): Promise<Item[]> {
    const valid =
      status && (Object.values(ItemStatus) as string[]).includes(status)
        ? (status as (typeof ItemStatus)[keyof typeof ItemStatus])
        : undefined;
    return this.items.list(valid);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createItemSchema)) body: CreateItemInput,
  ): Promise<Item> {
    return this.items.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.items.remove(id);
  }
}
