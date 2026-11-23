import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function syncAkshat() {
  console.log('⚡ Syncing Akshat Mohanty credentials across active database...');
  const passwordHash = await bcrypt.hash('MotoFit@2026', 10);

  // 1. Update existing garage2motofit@gmail.com
  const u1 = await prisma.user.upsert({
    where: { email: 'garage2motofit@gmail.com' },
    update: {
      name: 'Akshat Mohanty',
      phone: '+91 72596 25881',
      password: passwordHash,
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'lifetime_free',
      licenseKey: 'MOTOFIT-VIP-FOUNDING-2026',
    },
    create: {
      email: 'garage2motofit@gmail.com',
      name: 'Akshat Mohanty',
      phone: '+91 72596 25881',
      password: passwordHash,
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'lifetime_free',
      licenseKey: 'MOTOFIT-VIP-FOUNDING-2026',
    },
  });
  console.log('✅ Updated garage2motofit@gmail.com ->', u1.name);

  // 2. Upsert akshat@motoban.in
  const u2 = await prisma.user.upsert({
    where: { email: 'akshat@motoban.in' },
    update: {
      name: 'Akshat Mohanty',
      phone: '+91 72596 25881',
      password: passwordHash,
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'lifetime_free',
      licenseKey: 'AKSHAT-VIP-FOUNDING-2026',
    },
    create: {
      email: 'akshat@motoban.in',
      name: 'Akshat Mohanty',
      phone: '+91 72596 25881',
      password: passwordHash,
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'lifetime_free',
      licenseKey: 'AKSHAT-VIP-FOUNDING-2026',
    },
  });
  console.log('✅ Upserted akshat@motoban.in ->', u2.email);

  // 3. Upsert akshatmohanty@gmail.com
  const u3 = await prisma.user.upsert({
    where: { email: 'akshatmohanty@gmail.com' },
    update: {
      name: 'Akshat Mohanty',
      phone: '+91 72596 25881',
      password: passwordHash,
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'lifetime_free',
      licenseKey: 'AKSHAT-VIP-GMAIL-2026',
    },
    create: {
      email: 'akshatmohanty@gmail.com',
      name: 'Akshat Mohanty',
      phone: '+91 72596 25881',
      password: passwordHash,
      role: 'owner',
      garageType: 'two_wheeler',
      licenseStatus: 'lifetime_free',
      licenseKey: 'AKSHAT-VIP-GMAIL-2026',
    },
  });
  console.log('✅ Upserted akshatmohanty@gmail.com ->', u3.email);

  // 4. Upsert team settings for both Akshat and Samael
  for (const user of [u1, u2, u3]) {
    const settingKey = `team_${user.id}`;
    const team = [
      {
        id: 'team_akshat',
        name: 'Akshat Mohanty',
        phone: '7259625881',
        role: 'owner',
        pin: '1234',
        isActive: true,
        createdAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 'team_samael',
        name: 'Samael Morningstar',
        phone: '6359635416',
        role: 'super_admin',
        pin: '1234',
        isActive: true,
        createdAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 'team_munna',
        name: 'Munna Hezbollah',
        phone: '9123293450',
        role: 'senior_mechanic',
        pin: '1234',
        isActive: true,
        createdAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 'team_kunal',
        name: 'Kunal Chota Thakor',
        phone: '6354473666',
        role: 'senior_mechanic',
        pin: '1234',
        isActive: true,
        createdAt: '2026-10-01T10:00:00.000Z',
      },
    ];

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: JSON.stringify(team) },
      update: { value: JSON.stringify(team) },
    });
  }

  console.log('🎉 Akshat Mohanty credentials successfully configured & verified!');
}

syncAkshat()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
