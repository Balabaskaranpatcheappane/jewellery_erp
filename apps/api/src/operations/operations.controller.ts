import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createKarigarSchema,
  createJobOrderSchema,
  receiveJobOrderSchema,
  createSchemeSchema,
  addInstallmentSchema,
  createBranchSchema,
} from '@erp/shared';
import type {
  CreateKarigarInput,
  Karigar,
  CreateJobOrderInput,
  ReceiveJobOrderInput,
  JobOrder,
  CreateSchemeInput,
  AddInstallmentInput,
  Scheme,
  CreateBranchInput,
  Branch,
} from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KarigarService } from './karigar.service';
import { JobWorkService } from './jobwork.service';
import { SchemeService } from './scheme.service';
import { BranchService } from './branch.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(
    private readonly karigars: KarigarService,
    private readonly jobwork: JobWorkService,
    private readonly schemes: SchemeService,
    private readonly branches: BranchService,
  ) {}

  /* Karigars */
  @Get('karigars')
  listKarigars(): Promise<Karigar[]> {
    return this.karigars.list();
  }

  @Post('karigars')
  createKarigar(
    @Body(new ZodValidationPipe(createKarigarSchema)) body: CreateKarigarInput,
  ): Promise<Karigar> {
    return this.karigars.create(body);
  }

  /* Job work */
  @Get('job-orders')
  listJobs(): Promise<JobOrder[]> {
    return this.jobwork.list();
  }

  @Post('job-orders')
  createJob(
    @Body(new ZodValidationPipe(createJobOrderSchema)) body: CreateJobOrderInput,
  ): Promise<JobOrder> {
    return this.jobwork.create(body);
  }

  @Patch('job-orders/:id/receive')
  receiveJob(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(receiveJobOrderSchema)) body: ReceiveJobOrderInput,
  ): Promise<JobOrder> {
    return this.jobwork.receive(id, body);
  }

  /* Schemes */
  @Get('schemes')
  listSchemes(): Promise<Scheme[]> {
    return this.schemes.list();
  }

  @Post('schemes')
  createScheme(
    @Body(new ZodValidationPipe(createSchemeSchema)) body: CreateSchemeInput,
  ): Promise<Scheme> {
    return this.schemes.create(body);
  }

  @Post('schemes/:id/installments')
  addInstallment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addInstallmentSchema)) body: AddInstallmentInput,
  ): Promise<Scheme> {
    return this.schemes.addInstallment(id, body);
  }

  /* Branches */
  @Get('branches')
  listBranches(): Promise<Branch[]> {
    return this.branches.list();
  }

  @Post('branches')
  createBranch(
    @Body(new ZodValidationPipe(createBranchSchema)) body: CreateBranchInput,
  ): Promise<Branch> {
    return this.branches.create(body);
  }
}
