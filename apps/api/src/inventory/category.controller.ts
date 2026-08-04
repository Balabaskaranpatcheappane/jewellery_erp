import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createCategorySchema } from '@erp/shared';
import type { CreateCategoryInput, Category } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoryService } from './category.service';

@Controller('inventory/categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  list(): Promise<Category[]> {
    return this.categories.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryInput,
  ): Promise<Category> {
    return this.categories.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.categories.remove(id);
  }
}
