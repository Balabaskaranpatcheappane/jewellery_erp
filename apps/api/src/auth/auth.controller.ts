import { Body, Controller, Get, Post, UseGuards, UsePipes } from '@nestjs/common';
import { loginSchema } from '@erp/shared';
import type { LoginInput, LoginResponse, AuthUser } from '@erp/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: LoginInput): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
