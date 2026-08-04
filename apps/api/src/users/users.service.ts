import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { CreateUserInput, UserRecord } from '@erp/shared';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

type UserRow = Prisma.UserGetPayload<object>;

function toDto(u: UserRow): UserRecord {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<UserRecord[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDto);
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    try {
      const u = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
        },
      });
      return toDto(u);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Email "${input.email}" is already in use`);
      }
      throw e;
    }
  }

  async setActive(
    id: string,
    isActive: boolean,
    actingUserId: string,
  ): Promise<UserRecord> {
    if (id === actingUserId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (!isActive && user.role === 'ADMIN') {
      const activeAdmins = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdmins <= 1) {
        throw new BadRequestException('At least one active admin is required');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
    return toDto(updated);
  }
}
