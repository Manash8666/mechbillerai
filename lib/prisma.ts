import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Handle Serverless environment (e.g. Vercel)
if (process.env.VERCEL) {
  const tmpDb = '/tmp/dev.db';
  const bundledDb = path.join(process.cwd(), 'prisma', 'dev.db');
  try {
    if (!fs.existsSync(tmpDb) && fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, tmpDb);
    }
    if (fs.existsSync(tmpDb)) {
      process.env.DATABASE_URL = `file:${tmpDb}`;
    }
  } catch (err) {
    console.warn('Prisma /tmp SQLite setup note:', err);
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
