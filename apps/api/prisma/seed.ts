import { PrismaClient, UserRole, MetalType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@jewelry.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    // Authoritative reseed: always reset the admin's password/role/active flag so
    // `pnpm db:seed` reliably restores known-good credentials even if the row
    // already exists with a stale hash.
    update: { passwordHash, role: UserRole.ADMIN, isActive: true },
    create: {
      email,
      name: 'Administrator',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // A couple of sample rates so the rate-master screen isn't empty on first run.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.metalRate.upsert({
    where: {
      metal_purity_effectiveDate: {
        metal: MetalType.GOLD,
        purity: '916',
        effectiveDate: today,
      },
    },
    update: {},
    create: {
      metal: MetalType.GOLD,
      purity: '916',
      ratePerGram: 6250.0,
      effectiveDate: today,
      createdById: admin.id,
    },
  });

  await prisma.metalRate.upsert({
    where: {
      metal_purity_effectiveDate: {
        metal: MetalType.SILVER,
        purity: '999',
        effectiveDate: today,
      },
    },
    update: {},
    create: {
      metal: MetalType.SILVER,
      purity: '999',
      ratePerGram: 82.5,
      effectiveDate: today,
      createdById: admin.id,
    },
  });

  console.log(`Seeded admin user: ${email} (password: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
