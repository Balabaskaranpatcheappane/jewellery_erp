import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { createCustomerSchema } from '@erp/shared';
import type { CreateCustomerInput, Customer } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Query('search') search?: string): Promise<Customer[]> {
    return this.customers.list(search?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Customer> {
    return this.customers.get(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCustomerSchema)) body: CreateCustomerInput,
  ): Promise<Customer> {
    return this.customers.create(body);
  }
}
