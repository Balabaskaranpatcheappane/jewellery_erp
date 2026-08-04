import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createLoanSchema, addRepaymentSchema } from '@erp/shared';
import type { CreateLoanInput, AddRepaymentInput, Loan, LoanSummary, AuthUser } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { LoansService } from './loans.service';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Get()
  list(): Promise<LoanSummary[]> {
    return this.loans.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Loan> {
    return this.loans.get(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createLoanSchema)) body: CreateLoanInput,
    @CurrentUser() user: AuthUser,
  ): Promise<Loan> {
    return this.loans.create(body, user.id);
  }

  @Post(':id/repayments')
  addRepayment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addRepaymentSchema)) body: AddRepaymentInput,
  ): Promise<Loan> {
    return this.loans.addRepayment(id, body);
  }

  @Patch(':id/close')
  close(@Param('id') id: string): Promise<Loan> {
    return this.loans.close(id);
  }
}
