import { prisma } from '../lib/prisma';

async function updateAndVerify() {
  const user = await prisma.user.findFirst({ where: { email: 'garage2motofit@gmail.com' } });
  if (!user) throw new Error('User not found');

  await prisma.brandingSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      garageName: 'MotoFit 2 Workshop',
      primaryColor: '#f04923',
      canvasLightColor: '#0b132b',
      canvasDarkColor: '#0b132b',
      surfaceLightColor: '#16203d',
      surfaceDarkColor: '#16203d',
      textLightColor: '#ededed',
      textDarkColor: '#ededed',
      secondaryColor: '#ff6b4a',
      accentColor: '#f04923',
      upiId: 'motofit2@upi',
    },
    update: {
      garageName: 'MotoFit 2 Workshop',
      primaryColor: '#f04923',
      canvasLightColor: '#0b132b',
      canvasDarkColor: '#0b132b',
      surfaceLightColor: '#16203d',
      surfaceDarkColor: '#16203d',
      textLightColor: '#ededed',
      textDarkColor: '#ededed',
      secondaryColor: '#ff6b4a',
      accentColor: '#f04923',
      upiId: 'motofit2@upi',
    },
  });

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { branding: true },
  });

  console.log('✅ Updated User & Branding in Turso:');
  console.log({
    email: updated?.email,
    licenseStatus: updated?.licenseStatus,
    licenseKey: updated?.licenseKey,
    branding: updated?.branding,
  });
}

updateAndVerify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
