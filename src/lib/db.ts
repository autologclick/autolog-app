import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Prisma client with database-agnostic configuration.
 * Automatically detects SQLite (dev) or PostgreSQL (production) based on DATABASE_URL.
 */
const createPrismaClient = (): PrismaClient => {
  const url = process.env.DATABASE_URL || '';
  const isPostgreSQL = url.startsWith('postgresql');

  if (isPostgreSQL) {
    return new PrismaClient({
      errorFormat: 'pretty',
      log: ['error', 'warn'],
    });
  }

  return new PrismaClient({
    errorFormat: 'pretty',
  });
};

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
