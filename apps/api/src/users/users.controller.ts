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
  createUserSchema,
  setUserActiveSchema,
  UserRole,
} from '@erp/shared';
import type { CreateUserInput, SetUserActiveInput, UserRecord, AuthUser } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(): Promise<UserRecord[]> {
    return this.users.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
  ): Promise<UserRecord> {
    return this.users.create(body);
  }

  @Patch(':id/active')
  setActive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setUserActiveSchema)) body: SetUserActiveInput,
    @CurrentUser() user: AuthUser,
  ): Promise<UserRecord> {
    return this.users.setActive(id, body.isActive, user.id);
  }
}
