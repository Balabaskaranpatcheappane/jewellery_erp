import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicKey, verify, type KeyObject } from 'node:crypto';
import type { LicenseStatus } from '@erp/shared';
import { PrismaService } from '../prisma/prisma.service';

// Ed25519 public key used to verify product keys. Override with LICENSE_PUBLIC_KEY
// if you regenerate the vendor keypair.
const DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAE++R7mAihpLG6nOoyhHCsNTv/sRydifhnl3sbbdoHwM=
-----END PUBLIC KEY-----`;

interface LicensePayload {
  licensee: string;
  edition?: string;
  iat: number;
  exp?: number; // epoch seconds
}

const LICENSE_ID = 'default';

@Injectable()
export class LicenseService {
  private readonly publicKey: KeyObject;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const pem = config
      .get<string>('LICENSE_PUBLIC_KEY', DEFAULT_PUBLIC_KEY)
      .replace(/\\n/g, '\n');
    this.publicKey = createPublicKey(pem);
  }

  /** Verifies a `payload.signature` product key. Returns the payload or null. */
  private verifyKey(key: string): LicensePayload | null {
    const parts = key.trim().split('.');
    if (parts.length !== 2) return null;
    try {
      const payloadBuf = Buffer.from(parts[0], 'base64url');
      const sigBuf = Buffer.from(parts[1], 'base64url');
      const ok = verify(null, payloadBuf, this.publicKey, sigBuf);
      if (!ok) return null;
      return JSON.parse(payloadBuf.toString('utf8')) as LicensePayload;
    } catch {
      return null;
    }
  }

  private notExpired(exp?: number): boolean {
    return !exp || exp * 1000 > Date.now();
  }

  async status(): Promise<LicenseStatus> {
    const row = await this.prisma.license.findUnique({ where: { id: LICENSE_ID } });
    if (!row) return { activated: false, licensee: null, edition: null, expiresAt: null };
    const active = this.notExpired(row.expiresAt ? row.expiresAt.getTime() / 1000 : undefined);
    return {
      activated: active,
      licensee: row.licensee,
      edition: row.edition,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    };
  }

  async activate(key: string): Promise<LicenseStatus> {
    const payload = this.verifyKey(key);
    if (!payload) throw new BadRequestException('Invalid product key');
    if (!this.notExpired(payload.exp)) {
      throw new BadRequestException('This product key has expired');
    }
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
    await this.prisma.license.upsert({
      where: { id: LICENSE_ID },
      update: {
        key: key.trim(),
        licensee: payload.licensee,
        edition: payload.edition ?? null,
        activatedAt: new Date(),
        expiresAt,
      },
      create: {
        id: LICENSE_ID,
        key: key.trim(),
        licensee: payload.licensee,
        edition: payload.edition ?? null,
        expiresAt,
      },
    });
    return {
      activated: true,
      licensee: payload.licensee,
      edition: payload.edition ?? null,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  }
}
