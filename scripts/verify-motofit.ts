import { prisma } from '../lib/prisma';
import { checkTrialQuota } from '../lib/licensing';

async function verify() {
  console.log('--- VERIFYING MOTOFIT 2 ACCOUNT IN TURSO ---');
  const user = await prisma.user.findUnique({
    where: { email: 'garage2motofit@gmail.com' },
    include: {
      branding: true,
      customers: {
        include: { vehicles: true },
      },
      invoices: {
        include: { items: true },
      },
      inventoryItems: true,
    },
  });

  if (!user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User Found:', {
    id: user.id,
    email: user.email,
    name: user.name,
    licenseKey: user.licenseKey,
    licenseStatus: user.licenseStatus,
    subdomain: user.subdomain,
    expiresAt: user.expiresAt,
  });

  console.log('✅ Branding Palette:', {
    garageName: user.branding?.garageName,
    primaryColor: user.branding?.primaryColor,
    canvasDarkColor: user.branding?.canvasDarkColor,
    surfaceDarkColor: user.branding?.surfaceDarkColor,
    textDarkColor: user.branding?.textDarkColor,
  });

  console.log(`✅ Customers: ${user.customers.length}`);
  user.customers.forEach((c) => {
    console.log(`  - ${c.name} (${c.phone}) | Vehicles: ${c.vehicles.map((v) => v.registrationNo).join(', ')}`);
  });

  console.log(`✅ Invoices: ${user.invoices.length}`);
  user.invoices.forEach((inv) => {
    console.log(`  - ${inv.invoiceNumber} | Total: ₹${inv.total} | Status: ${inv.status} | Items: ${inv.items.map((i) => i.description).join(', ')}`);
  });

  console.log(`✅ Inventory Items: ${user.inventoryItems.length}`);
  user.inventoryItems.forEach((it) => {
    console.log(`  - ${it.name} | Qty: ${it.quantity} | ₹${it.sellingPrice}`);
  });

  // Verify Quota Logic
  const quota = await checkTrialQuota(user.id, 'BILL');
  console.log('✅ VIP Quota Check:', quota);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
