import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Upserting Samael / Manash super-admin user...');

  // Purge old demo users if they exist
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['test@garagesaas.com', 'demo@garagesaas.com', 'newuser123@garagesaas.com'],
      },
    },
  });

  const passwordHash = await bcrypt.hash('MotoFit@2026', 10);

  const samaelUser = await prisma.user.upsert({
    where: { email: 'manashdash@aol.com' },
    update: {
      name: 'Samael Morningstar',
      phone: '+91 63596 35416',
      role: 'owner',
      licenseStatus: 'lifetime_free',
      licenseKey: 'SAMAEL-VIP-FOUNDING-2026',
      garageType: 'two_wheeler',
      expiresAt: null,
    },
    create: {
      email: 'manashdash@aol.com',
      password: passwordHash,
      name: 'Samael Morningstar',
      phone: '+91 63596 35416',
      role: 'owner',
      licenseStatus: 'lifetime_free',
      licenseKey: 'SAMAEL-VIP-FOUNDING-2026',
      garageType: 'two_wheeler',
      expiresAt: null,
    },
  });

  await prisma.brandingSettings.upsert({
    where: { userId: samaelUser.id },
    create: {
      userId: samaelUser.id,
      garageName: 'MotoFit Workshop',
      primaryColor: '#C9F31D',
      canvasDarkColor: '#0B0F19',
      surfaceDarkColor: '#151D2F',
      textDarkColor: '#F8FAFC',
      upiId: '6359635416@upi',
    },
    update: {
      garageName: 'MotoFit Workshop',
      primaryColor: '#C9F31D',
    },
  });

  console.log('✅ Samael / Manash user configured:', {
    id: samaelUser.id,
    email: samaelUser.email,
    name: samaelUser.name,
    phone: samaelUser.phone,
    role: samaelUser.role,
    licenseStatus: samaelUser.licenseStatus,
  });

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true, role: true, licenseStatus: true },
  });
  console.log('--- Current Clean User List ---');
  console.log(JSON.stringify(remainingUsers, null, 2));
}

main().finally(() => prisma.$disconnect());
