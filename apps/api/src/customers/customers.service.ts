import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { CreateCustomerInput, Customer } from '@erp/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CustomerRow = Prisma.CustomerGetPayload<object>;

function toDto(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    gstin: row.gstin,
    address: row.address,
    city: row.city,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string): Promise<Customer[]> {
    const rows = await this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: 200,
    });
    return rows.map(toDto);
  }

  async get(id: string): Promise<Customer> {
    const row = await this.prisma.customer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Customer not found');
    return toDto(row);
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    try {
      const row = await this.prisma.customer.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email ? input.email : null,
          gstin: input.gstin ? input.gstin : null,
          address: input.address ? input.address : null,
          city: input.city ? input.city : null,
        },
      });
      return toDto(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `A customer with phone "${input.phone}" already exists`,
        );
      }
      throw e;
    }
  }
}
