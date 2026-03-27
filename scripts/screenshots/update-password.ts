import { hashPassword } from 'better-auth/crypto';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const hashed = await hashPassword('password123');
  const account = await prisma.account.findFirst({ where: { accountId: 'test@example.com', providerId: 'credential' } });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });
    console.log('Password updated');
  } else {
    console.log('Account not found!');
  }
  await prisma.$disconnect();
}

main().catch(console.error);
