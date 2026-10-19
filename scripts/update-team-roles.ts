import { prisma } from '../lib/prisma';

async function updateRoles() {
  const user = await prisma.user.findFirst({ where: { email: 'garage2motofit@gmail.com' } });
  if (!user) throw new Error('User not found');

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

  console.log('✅ Successfully updated MotoFit 2 Team in Turso:');
  console.log(team.map((t) => `${t.name}: ${t.role}`));
}

updateRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
