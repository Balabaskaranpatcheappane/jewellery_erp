import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { KarigarService } from './karigar.service';
import { JobWorkService } from './jobwork.service';
import { SchemeService } from './scheme.service';
import { BranchService } from './branch.service';

@Module({
  controllers: [OperationsController],
  providers: [KarigarService, JobWorkService, SchemeService, BranchService],
})
export class OperationsModule {}
