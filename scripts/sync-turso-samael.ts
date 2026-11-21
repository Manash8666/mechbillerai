import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('⚡ Upserting Samael / Manash into Turso Cloud Database...');

  // Remove demo user from Turso
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['demo@garagesaas.com', 'test@garagesaas.com', 'newuser123@garagesaas.com'],
        },
      },
    });
    console.log('🧹 Purged demo users from Turso.');
  } catch (err) {
    console.warn('Note during demo purge:', err);
  }

  // Hash password for Samael / Manash
  // We'll set a secure default known to the owner: MotoFit@2026
  const passwordHash = await bcrypt.hash('MotoFit@2026', 10);

  const samaelUser = await prisma.user.upsert({
    where: { email: 'manashdash@aol.com' },
    update: {
      name: 'Samael Morningstar',
      phone: '+91 63596 35416',
      role: 'owner',
      licenseStatus: 'lifetime_free',
      licenseKey: 'SAMAEL-VIP-FOUNDING-2026',
      garageType: 'four_wheeler',
      expiresAt: null,
      password: passwordHash,
    },
    create: {
      email: 'manashdash@aol.com',
      password: passwordHash,
      name: 'Samael Morningstar',
      phone: '+91 63596 35416',
      role: 'owner',
      licenseStatus: 'lifetime_free',
      licenseKey: 'SAMAEL-VIP-FOUNDING-2026',
      garageType: 'four_wheeler',
      expiresAt: null,
    },
  });

  // Also upsert branding
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

  console.log('✅ Samael / Manash user active in Turso:', {
    id: samaelUser.id,
    email: samaelUser.email,
    name: samaelUser.name,
    phone: samaelUser.phone,
    role: samaelUser.role,
    licenseStatus: samaelUser.licenseStatus,
  });

  const allTursoUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true, role: true, licenseStatus: true },
  });
  console.log('--- ALL LIVE TURSO USERS ---');
  console.log(JSON.stringify(allTursoUsers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
