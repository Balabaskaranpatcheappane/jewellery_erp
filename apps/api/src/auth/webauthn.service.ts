import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import type { AuthUser, LoginResponse } from '@erp/shared';
import { PrismaService } from '../prisma/prisma.service';

interface StoredChallenge {
  challenge: string;
  expires: number;
}

@Injectable()
export class WebAuthnService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origins: string[];
  private readonly challenges = new Map<string, StoredChallenge>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.rpName = config.get<string>('RP_NAME', 'Jewelry ERP');
    this.rpID = config.get<string>('RP_ID', 'localhost');
    this.origins = config
      .get<string>('RP_ORIGIN', 'http://localhost:5173,http://localhost:4180')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  private putChallenge(key: string, challenge: string): void {
    this.challenges.set(key, { challenge, expires: Date.now() + 5 * 60_000 });
  }

  private takeChallenge(key: string): string {
    const entry = this.challenges.get(key);
    this.challenges.delete(key);
    if (!entry || entry.expires < Date.now()) {
      throw new BadRequestException('Challenge expired, please try again');
    }
    return entry.challenge;
  }

  private parseTransports(s: string | null): AuthenticatorTransportFuture[] | undefined {
    if (!s) return undefined;
    try {
      return JSON.parse(s) as AuthenticatorTransportFuture[];
    } catch {
      return undefined;
    }
  }

  /* ------------------------------ Registration ---------------------------- */

  async registrationOptions(user: AuthUser) {
    const creds = await this.prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
    });
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: creds.map((c) => ({
        id: c.credentialId,
        transports: this.parseTransports(c.transports),
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });
    this.putChallenge(`reg:${user.id}`, options.challenge);
    return options;
  }

  async registrationVerify(
    user: AuthUser,
    response: RegistrationResponseJSON,
  ): Promise<{ verified: boolean }> {
    const expectedChallenge = this.takeChallenge(`reg:${user.id}`);
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origins,
      expectedRPID: this.rpID,
    });
    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Fingerprint registration failed');
    }
    const { credential } = verification.registrationInfo;
    await this.prisma.webAuthnCredential.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports
          ? JSON.stringify(credential.transports)
          : null,
        label: 'Fingerprint / Windows Hello',
      },
    });
    return { verified: true };
  }

  /* ---------------------------- Authentication ---------------------------- */

  async loginOptions(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { webauthnCredentials: true },
    });
    if (!user || user.webauthnCredentials.length === 0) {
      throw new BadRequestException('No fingerprint is enrolled for this account');
    }
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'preferred',
      allowCredentials: user.webauthnCredentials.map((c) => ({
        id: c.credentialId,
        transports: this.parseTransports(c.transports),
      })),
    });
    this.putChallenge(`auth:${email.toLowerCase()}`, options.challenge);
    return options;
  }

  async loginVerify(
    email: string,
    response: AuthenticationResponseJSON,
  ): Promise<LoginResponse> {
    const key = email.toLowerCase();
    const expectedChallenge = this.takeChallenge(`auth:${key}`);
    const user = await this.prisma.user.findUnique({
      where: { email: key },
      include: { webauthnCredentials: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const cred = user.webauthnCredentials.find((c) => c.credentialId === response.id);
    if (!cred) throw new UnauthorizedException('Fingerprint not recognized');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origins,
      expectedRPID: this.rpID,
      credential: {
        id: cred.credentialId,
        publicKey: new Uint8Array(cred.publicKey),
        counter: cred.counter,
        transports: this.parseTransports(cred.transports),
      },
    });
    if (!verification.verified) {
      throw new UnauthorizedException('Fingerprint verification failed');
    }
    await this.prisma.webAuthnCredential.update({
      where: { id: cred.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
