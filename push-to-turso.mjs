import { createClient } from '@libsql/client';
import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';

const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  'libsql://motoban-manash8666.aws-ap-south-1.turso.io';
const TURSO_AUTH_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE5NTk4NDgsImlkIjoiMDFhMTM5MjAtYzYwMS03YjFkLTgwMGYtYjkwMTc0ZDYwMTA0Iiwia2lkIjoiTmVoUjRKTDk1aHY1dVVrbU5VNTkxY3QzUnZ2WXdxM1BhSTBzLVpOWlVNTSIsInJpZCI6IjRmZmEzOTU0LTljOTgtNDBkMi1hNjM2LWNmOGFhMDJiYmFjYSJ9.YYZJhvc2bhTzPRDs4yR5zaK5eA9dDEJsdw1MNAkPqwoznDuptW3ignDm18r8b9c9JISKk4lj6JomOOEey38XCA';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('1. Generating schema SQL via Prisma migrate diff...');
  const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf-8',
  });

  console.log('2. Applying schema to Turso cloud database...');
  await client.executeMultiple(sql);
  console.log('✅ Schema successfully pushed to Turso!');

  console.log('3. Seeding essential demo user and default records...');
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const now = new Date().toISOString();

  // Insert or ignore Demo User
  await client.execute({
    sql: `INSERT OR IGNORE INTO User (id, email, password, name, phone, role, garageType, gstEnabled, licenseKey, licenseStatus, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'cmv4zl4620001d96sd1e0qto2',
      'demo@garagesaas.com',
      hashedPassword,
      'MotoBan Workshop',
      '+91 98765 43210',
      'owner',
      'four_wheeler',
      0,
      'MOTOBAN-PRO-DEMO',
      'active',
      now,
      now,
    ],
  });

  // Insert or ignore Branding
  await client.execute({
    sql: `INSERT OR IGNORE INTO BrandingSettings (id, userId, garageName, primaryColor, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      'branding_cmv4zl462',
      'cmv4zl4620001d96sd1e0qto2',
      'MotoBan Workshop',
      '#C9A84C',
      now,
      now,
    ],
  });

  // Verify
  const userCheck = await client.execute('SELECT count(*) as count FROM User');
  console.log('✅ Turso Users table count:', userCheck.rows[0].count);

  const tablesCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('✅ Turso Tables present:', tablesCheck.rows.map(r => r.name).join(', '));
}

main().catch((err) => {
  console.error('Push failed:', err);
  process.exit(1);
});
