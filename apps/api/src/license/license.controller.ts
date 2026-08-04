import { Body, Controller, Get, Post } from '@nestjs/common';
import { activateLicenseSchema } from '@erp/shared';
import type { ActivateLicenseInput, LicenseStatus } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { LicenseService } from './license.service';

// Public — activation happens before login.
@Controller('license')
export class LicenseController {
  constructor(private readonly license: LicenseService) {}

  @Get()
  status(): Promise<LicenseStatus> {
    return this.license.status();
  }

  @Post('activate')
  activate(
    @Body(new ZodValidationPipe(activateLicenseSchema)) body: ActivateLicenseInput,
  ): Promise<LicenseStatus> {
    return this.license.activate(body.key);
  }
}
