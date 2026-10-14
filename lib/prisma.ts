import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Handle Serverless environment (e.g. Vercel)
if (process.env.VERCEL) {
  const tmpDir = os.tmpdir();
  const tmpDb = path.join(tmpDir, 'motoban_dev.db');
  const legacyTmpDb = path.join(tmpDir, 'mechbiller_dev.db');
  const bundledDb = path.join(process.cwd(), 'prisma', 'dev.db');
  try {
    if (!fs.existsSync(tmpDb)) {
      if (fs.existsSync(legacyTmpDb)) {
        fs.copyFileSync(legacyTmpDb, tmpDb);
      } else if (fs.existsSync(bundledDb)) {
        fs.copyFileSync(bundledDb, tmpDb);
      }
    }
    if (fs.existsSync(tmpDb)) {
      process.env.DATABASE_URL = `file:${tmpDb}`;
    }
  } catch (err) {
    console.warn('Prisma serverless SQLite setup note:', err);
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
