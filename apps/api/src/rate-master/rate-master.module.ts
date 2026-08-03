import { Module } from '@nestjs/common';
import { RateMasterController } from './rate-master.controller';
import { RateMasterService } from './rate-master.service';

@Module({
  controllers: [RateMasterController],
  providers: [RateMasterService],
})
export class RateMasterModule {}
