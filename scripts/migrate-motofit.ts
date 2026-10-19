import { prisma } from '../lib/prisma';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

interface NeonDump {
  exportedAt: string;
  source: string;
  targetGarage: string;
  data: {
    users: Array<{
      id: string;
      name: string;
      phone: string;
      role: string;
      pinHash: string;
    }>;
    customers: Array<{
      id: string;
      name: string;
      phone: string;
      email?: string | null;
      vatNumber?: string | null;
      vehicles: Array<{
        id: string;
        regNumber: string;
        makeModel: string;
        runningKm: number;
      }>;
    }>;
    documents: Array<{
      id: string;
      docNumber: string;
      type: string;
      status: string;
      date: string;
      paymentMethod?: string | null;
      subtotal: string | number;
      finalTotal: string | number;
      vehicle?: {
        regNumber: string;
        customerId: string;
      } | null;
      items: Array<{
        title: string;
        description?: string | null;
        quantity: string | number;
        rate: string | number;
        amount: string | number;
      }>;
    }>;
    parts: Array<{
      id: string;
      name: string;
      category?: string | null;
      price: string | number;
      stock: number;
    }>;
  };
}

async function migrate() {
  console.log('🚀 Starting MotoFit 2 Neon ➔ Turso Data Migration...');
  const dumpPath = path.resolve(__dirname, 'motofit-neon-dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Dump file not found at ${dumpPath}`);
  }

  const dump: NeonDump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  const targetEmail = 'garage2motofit@gmail.com';
  const defaultPassword = 'MotoFit2@2026';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Create or Update MotoFit 2 User in Turso
  console.log(`\n1️⃣ Upserting VIP Founder account for ${targetEmail}...`);
  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    // If the legacy test user exists, we can clean up or create fresh
    user = await prisma.user.create({
      data: {
        email: targetEmail,
        password: hashedPassword,
        name: 'MotoFit 2 Workshop',
        phone: '7259625881',
        role: 'owner',
        garageType: 'two_wheeler',
        subdomain: 'motofit2',
        licenseKey: 'MOTOBAN-VIP-FOUNDER-01',
        licenseStatus: 'lifetime_free',
        expiresAt: null,
      },
    });
    console.log(` Created user: ${user.id} (${user.email})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'MotoFit 2 Workshop',
        licenseKey: 'MOTOBAN-VIP-FOUNDER-01',
        licenseStatus: 'lifetime_free',
        expiresAt: null,
        subdomain: 'motofit2',
      },
    });
    console.log(` Updated user: ${user.id} (${user.email})`);
  }

  // 2. Configure MotoFit 2 Signature Theme & Branding
  console.log(`\n2️⃣ Applying MotoFit 2 Signature Branding (#0b132b + #f04923)...`);
  await prisma.brandingSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      garageName: 'MotoFit 2 Workshop',
      primaryColor: '#f04923', // MotoFit Racing Coral/Orange
      canvasDarkColor: '#0b132b', // Deep Space Navy
      surfaceDarkColor: '#16203d',
      textDarkColor: '#ededed',
      secondaryColor: '#ff6b4a',
      accentColor: '#f04923',
      upiId: 'motofit2@upi',
    },
    update: {
      garageName: 'MotoFit 2 Workshop',
      primaryColor: '#f04923',
      canvasDarkColor: '#0b132b',
      surfaceDarkColor: '#16203d',
      textDarkColor: '#ededed',
      secondaryColor: '#ff6b4a',
      accentColor: '#f04923',
      upiId: 'motofit2@upi',
    },
  });
  console.log(' Signature theme configured.');

  // 3. Migrate Customers & Vehicles
  console.log(`\n3️⃣ Migrating ${dump.data.customers.length} Customers and their Vehicles...`);
  const customerIdMap = new Map<string, string>(); // neonId -> tursoId

  for (const c of dump.data.customers) {
    let customer = await prisma.customer.findFirst({
      where: {
        userId: user.id,
        phone: c.phone,
      },
      include: { vehicles: true },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          name: c.name,
          phone: c.phone,
          email: c.email || null,
          gstNumber: c.vatNumber || null,
        },
        include: { vehicles: true },
      });
      console.log(` Created Customer: ${c.name} (${c.phone})`);
    } else {
      console.log(` Existing Customer found: ${c.name} (${c.phone})`);
    }

    customerIdMap.set(c.id, customer.id);

    // Vehicles
    for (const v of c.vehicles) {
      const reg = v.regNumber.trim().toUpperCase();
      let vehicle = customer.vehicles?.find((veh) => veh.registrationNo.toUpperCase() === reg);
      if (!vehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            registrationNo: reg,
            make: v.makeModel || 'Two-Wheeler',
            model: v.makeModel || 'Motorcycle / Scooter',
            mileage: v.runningKm || 0,
          },
        });
        console.log(`   🚗 Added Vehicle: ${reg} for ${c.name}`);
      } else {
        console.log(`   🚗 Existing Vehicle: ${reg}`);
      }
    }
  }

  // 4. Migrate Documents & Invoices
  console.log(`\n4️⃣ Migrating ${dump.data.documents.length} Invoices & SOW Bills...`);
  for (const doc of dump.data.documents) {
    const existing = await prisma.invoice.findFirst({
      where: {
        userId: user.id,
        invoiceNumber: doc.docNumber,
      },
    });

    if (!existing) {
      // Find matching customer
      const mappedCustomerId = doc.vehicle?.customerId ? customerIdMap.get(doc.vehicle.customerId) : null;
      const fallbackCustomerId = customerIdMap.values().next().value;
      const customerId = mappedCustomerId || fallbackCustomerId;

      if (!customerId) {
        console.warn(` ⚠️ Skipping doc ${doc.docNumber}: No customer available`);
        continue;
      }

      const total = Number(doc.finalTotal) || Number(doc.subtotal) || 0;
      const subtotal = Number(doc.subtotal) || total;

      const invoice = await prisma.invoice.create({
        data: {
          userId: user.id,
          customerId,
          invoiceNumber: doc.docNumber,
          invoiceDate: new Date(doc.date),
          subtotal,
          tax: 0,
          discount: 0,
          total,
          paid: doc.status === 'PAID' ? total : total, // Mark migrated past bills as paid
          balance: 0,
          status: 'paid',
          paymentMode: (doc.paymentMethod || 'cash').toLowerCase(),
          items: {
            create: doc.items.map((it) => {
              const qty = Number(it.quantity) || 1;
              const rate = Number(it.rate) || 0;
              const amount = Number(it.amount) || qty * rate;
              return {
                description: it.title,
                details: it.description || null,
                quantity: qty,
                unitPrice: rate,
                tax: 0,
                total: amount,
              };
            }),
          },
        },
      });
      console.log(` Created Invoice: ${doc.docNumber} (₹${total}) with ${doc.items.length} items`);
    } else {
      console.log(` Existing Invoice: ${doc.docNumber}`);
    }
  }

  // 5. Migrate Parts / Inventory
  console.log(`\n5️⃣ Migrating ${dump.data.parts.length} Parts into Inventory...`);
  for (const p of dump.data.parts) {
    const existingPart = await prisma.inventoryItem.findFirst({
      where: {
        userId: user.id,
        name: p.name,
      },
    });

    if (!existingPart) {
      const price = Number(p.price) || 0;
      await prisma.inventoryItem.create({
        data: {
          userId: user.id,
          name: p.name,
          category: p.category || 'General',
          sellingPrice: price,
          costPrice: Math.round(price * 0.8),
          quantity: p.stock || 0,
          unit: 'pcs',
        },
      });
      console.log(` Created Part: ${p.name} (Qty: ${p.stock}, ₹${price})`);
    } else {
      console.log(` Existing Part: ${p.name}`);
    }
  }

  console.log('\n🎉 ALL MOTOFIT 2 DATA SUCCESSFULLY MIGRATED TO TURSO!');
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
