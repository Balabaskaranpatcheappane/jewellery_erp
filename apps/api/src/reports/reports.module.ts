import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { ShopModule } from '../shop/shop.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [BillingModule, ShopModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
