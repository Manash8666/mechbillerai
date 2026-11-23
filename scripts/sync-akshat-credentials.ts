import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function syncAllCredentials() {
  console.log('⚡ Synchronizing all MotoBan & MotoFit 2 credentials in database...');
  const passwordHash = await bcrypt.hash('MotoFit@2026', 10);

  const usersToSync = [
    {
      name: 'Akshat Mohanty',
      email: 'akshat@motoban.in',
      phone: '+91 72596 25881',
      role: 'owner',
      licenseKey: 'AKSHAT-VIP-FOUNDING-2026',
    },
    {
      name: 'Akshat Mohanty',
      email: 'garage2motofit@gmail.com',
      phone: '+91 72596 25881',
      role: 'owner',
      licenseKey: 'MOTOFIT-VIP-FOUNDING-2026',
    },
    {
      name: 'Akshat Mohanty',
      email: 'akshatmohanty@gmail.com',
      phone: '+91 72596 25881',
      role: 'owner',
      licenseKey: 'AKSHAT-VIP-GMAIL-2026',
    },
    {
      name: 'Samael Morningstar',
      email: 'manashdash@aol.com',
      phone: '+91 63596 35416',
      role: 'owner',
      licenseKey: 'SAMAEL-VIP-FOUNDING-2026',
    },
    {
      name: 'Samael Morningstar',
      email: 'samael@motoban.in',
      phone: '+91 63596 35416',
      role: 'owner',
      licenseKey: 'SAMAEL-VIP-MOTOBAN-2026',
    },
    {
      name: 'Munna Hezbollah',
      email: 'munna@motoban.in',
      phone: '+91 91232 93450',
      role: 'senior_mechanic',
      licenseKey: 'MUNNA-VIP-STAFF-2026',
    },
    {
      name: 'Kunal Chota Thakor',
      email: 'kunal@motoban.in',
      phone: '+91 63544 73666',
      role: 'senior_mechanic',
      licenseKey: 'KUNAL-VIP-STAFF-2026',
    },
    {
      name: 'MotoFit 2 Manager',
      email: 'manager@motoban.in',
      phone: '+91 72596 25881',
      role: 'manager',
      licenseKey: 'MANAGER-VIP-STAFF-2026',
    },
  ];

  for (const u of usersToSync) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        password: passwordHash,
        role: u.role,
        garageType: 'two_wheeler',
        licenseStatus: 'lifetime_free',
      },
      create: {
        email: u.email,
        name: u.name,
        phone: u.phone,
        password: passwordHash,
        role: u.role,
        garageType: 'two_wheeler',
        licenseStatus: 'lifetime_free',
        licenseKey: u.licenseKey,
      },
    });
    console.log(`✅ Synced: ${user.name} (${user.email}) [${user.role}]`);

    // Setup team settings for each
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
      {
        id: 'team_manager',
        name: 'MotoFit Manager',
        phone: '7259625881',
        role: 'manager',
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

  console.log('🎉 All credentials and team roles successfully synced across active database!');
}

syncAllCredentials()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
