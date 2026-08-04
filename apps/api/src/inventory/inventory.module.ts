import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  controllers: [CategoryController, ItemController],
  providers: [CategoryService, ItemService],
})
export class InventoryModule {}
