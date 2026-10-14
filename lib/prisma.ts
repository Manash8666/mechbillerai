import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const rawTursoUrl =
  process.env.TURSO_DATABASE_URL ||
  (process.env.DATABASE_URL?.startsWith('libsql://') ? process.env.DATABASE_URL : undefined);
const tursoUrl = rawTursoUrl ? rawTursoUrl.trim() : undefined;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.trim() : undefined;

function createPrismaClient(): PrismaClient {
  // If Turso Cloud database is configured, use the high-performance LibSQL adapter
  if (tursoUrl && tursoAuthToken) {
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    return new PrismaClient({ adapter });
  }

  // Handle Serverless local fallback environment (e.g. Vercel without Turso configured)
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

  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

