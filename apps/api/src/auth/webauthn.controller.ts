import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import type { AuthUser, LoginResponse } from '@erp/shared';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { WebAuthnService } from './webauthn.service';

@Controller('auth/webauthn')
export class WebAuthnController {
  constructor(private readonly webauthn: WebAuthnService) {}

  @Post('register/options')
  @UseGuards(JwtAuthGuard)
  registerOptions(@CurrentUser() user: AuthUser) {
    return this.webauthn.registrationOptions(user);
  }

  @Post('register/verify')
  @UseGuards(JwtAuthGuard)
  registerVerify(
    @CurrentUser() user: AuthUser,
    @Body() body: RegistrationResponseJSON,
  ): Promise<{ verified: boolean }> {
    return this.webauthn.registrationVerify(user, body);
  }

  @Post('login/options')
  loginOptions(@Body('email') email: string) {
    return this.webauthn.loginOptions(email);
  }

  @Post('login/verify')
  loginVerify(
    @Body('email') email: string,
    @Body('response') response: AuthenticationResponseJSON,
  ): Promise<LoginResponse> {
    return this.webauthn.loginVerify(email, response);
  }
}
