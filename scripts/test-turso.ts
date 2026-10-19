import { prisma } from '../lib/prisma';

async function checkMotoFit() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'garage2motofit@gmail.com' },
        { email: 'motofit2@garagesaas.com' },
        { subdomain: 'motofit' },
        { subdomain: 'motofit2' },
      ],
    },
    include: {
      branding: true,
      customers: {
        include: { vehicles: true },
      },
      invoices: true,
    },
  });
  console.log('EXISTING MOTOFIT USER:', JSON.stringify(user, null, 2));
}

checkMotoFit().catch(console.error).finally(() => prisma.$disconnect());
