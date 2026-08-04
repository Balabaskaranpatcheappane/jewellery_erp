import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { restoreBackupSchema } from '@erp/shared';
import type { BackupFile, RestoreBackupInput } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BackupService } from './backup.service';

@Controller('admin/backups')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly backups: BackupService) {}

  @Get()
  list(): Promise<BackupFile[]> {
    return this.backups.list();
  }

  @Post()
  create(): Promise<BackupFile> {
    return this.backups.create();
  }

  @Post('restore')
  restore(
    @Body(new ZodValidationPipe(restoreBackupSchema)) body: RestoreBackupInput,
  ): Promise<{ restored: string }> {
    return this.backups.restore(body.filename);
  }
}
