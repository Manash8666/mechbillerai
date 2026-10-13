import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing non-user data to enable idempotent re-seeding
  await prisma.brandingSettings.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.jobTask.deleteMany({});
  await prisma.jobCard.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.customer.deleteMany({});

  // Create test users
  const hashedPassword = await bcrypt.hash('test123', 10);

  // Test User 1 - ABC Motors (Four-Wheeler)
  const user1 = await prisma.user.upsert({
    where: { email: 'test@garagesaas.com' },
    update: {},
    create: {
      email: 'test@garagesaas.com',
      password: hashedPassword,
      name: 'Test User',
      phone: '+91 98765 43210',
      role: 'owner',
      garageType: 'four_wheeler',
      licenseKey: 'TEST-1234-ABCD-5678',
      licenseStatus: 'active',
      expiresAt: null, // Lifetime access
    },
  });

  console.log('✅ Created test user:', user1.email);

  // Test User 2 - Speed Garage (Two-Wheeler)
  const user2 = await prisma.user.upsert({
    where: { email: 'demo@garagesaas.com' },
    update: {
      garageType: 'two_wheeler',
    },
    create: {
      email: 'demo@garagesaas.com',
      password: hashedPassword,
      name: 'Demo Garage',
      phone: '+91 99999 88888',
      role: 'owner',
      garageType: 'two_wheeler',
      licenseKey: 'DEMO-9876-WXYZ-4321',
      licenseStatus: 'active',
      expiresAt: null,
    },
  });

  console.log('✅ Created demo user:', user2.email);

  // Create sample customers for user1
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rahul Patel',
      phone: '+91 98765 11111',
      email: 'rahul@example.com',
      address: '123 Ellis Bridge, Ahmedabad',
      gstNumber: '24AABCU9603R1ZV',
      userId: user1.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Shah',
      phone: '+91 98765 22222',
      email: 'priya@example.com',
      address: '456 CG Road, Ahmedabad',
      userId: user1.id,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Amit Desai',
      phone: '+91 98765 33333',
      email: 'amit@example.com',
      address: '789 Satellite, Ahmedabad',
      userId: user1.id,
    },
  });

  console.log('✅ Created 3 sample customers');

  // Create vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      registrationNo: 'GJ-01-AB-1234',
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2020,
      color: 'Red',
      customerId: customer1.id,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      registrationNo: 'GJ-01-CD-5678',
      make: 'Hyundai',
      model: 'i20',
      year: 2021,
      color: 'White',
      customerId: customer2.id,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      registrationNo: 'GJ-01-EF-9012',
      make: 'Honda',
      model: 'City',
      year: 2022,
      color: 'Silver',
      customerId: customer3.id,
    },
  });

  console.log('✅ Created 3 sample vehicles');

  // Create job cards
  const jobCard1 = await prisma.jobCard.create({
    data: {
      jobNumber: 'JOB-2410-0001',
      customerId: customer1.id,
      vehicleId: vehicle1.id,
      status: 'in-progress',
      priority: 'high',
      description: 'Oil change and general service',
      estimatedCost: 2500,
      userId: user1.id,
      tasks: {
        create: [
          { description: 'Engine oil change', completed: true, order: 1 },
          { description: 'Oil filter replacement', completed: true, order: 2 },
          { description: 'Air filter check', completed: false, order: 3 },
          { description: 'Brake inspection', completed: false, order: 4 },
        ],
      },
    },
  });

  const jobCard2 = await prisma.jobCard.create({
    data: {
      jobNumber: 'JOB-2410-0002',
      customerId: customer2.id,
      vehicleId: vehicle2.id,
      status: 'completed',
      priority: 'normal',
      description: 'Tire rotation and alignment',
      estimatedCost: 1500,
      actualCost: 1500,
      userId: user1.id,
      completedDate: new Date(),
      tasks: {
        create: [
          { description: 'Remove all tires', completed: true, order: 1 },
          { description: 'Check tire pressure', completed: true, order: 2 },
          { description: 'Rotate tires', completed: true, order: 3 },
          { description: 'Wheel alignment', completed: true, order: 4 },
        ],
      },
    },
  });

  console.log('✅ Created 2 sample job cards');

  // Create invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2410-0001',
      customerId: customer2.id,
      jobCardId: jobCard2.id,
      subtotal: 1271.19,
      tax: 228.81,
      total: 1500,
      paid: 1500,
      balance: 0,
      status: 'paid',
      paymentMode: 'upi',
      userId: user1.id,
      items: {
        create: [
          {
            description: 'Tire Rotation Service',
            quantity: 1,
            unitPrice: 800,
            tax: 144,
            total: 944,
          },
          {
            description: 'Wheel Alignment',
            quantity: 1,
            unitPrice: 471.19,
            tax: 84.81,
            total: 556,
          },
        ],
      },
      payments: {
        create: {
          amount: 1500,
          paymentMode: 'upi',
          notes: 'Paid via Google Pay',
        },
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2410-0002',
      customerId: customer3.id,
      subtotal: 4237.29,
      tax: 762.71,
      total: 5000,
      paid: 2000,
      balance: 3000,
      status: 'partial',
      paymentMode: 'cash',
      userId: user1.id,
      items: {
        create: [
          {
            description: 'Brake Pad Replacement',
            quantity: 1,
            unitPrice: 2500,
            tax: 450,
            total: 2950,
          },
          {
            description: 'Brake Fluid Flush',
            quantity: 1,
            unitPrice: 800,
            tax: 144,
            total: 944,
          },
          {
            description: 'Labor Charges',
            quantity: 1,
            unitPrice: 937.29,
            tax: 168.71,
            total: 1106,
          },
        ],
      },
      payments: {
        create: {
          amount: 2000,
          paymentMode: 'cash',
          notes: 'Advance payment',
        },
      },
    },
  });

  console.log('✅ Created 2 sample invoices');

  // Create inventory items
  await prisma.inventoryItem.createMany({
    data: [
      {
        name: 'Engine Oil 5W-30',
        code: 'OIL-5W30',
        category: 'Lubricants',
        quantity: 50,
        unit: 'ltr',
        minQuantity: 20,
        costPrice: 450,
        sellingPrice: 650,
        gstRate: 18,
      },
      {
        name: 'Oil Filter',
        code: 'FILTER-001',
        category: 'Filters',
        quantity: 30,
        unit: 'pcs',
        minQuantity: 15,
        costPrice: 180,
        sellingPrice: 280,
        gstRate: 18,
      },
      {
        name: 'Air Filter',
        code: 'FILTER-002',
        category: 'Filters',
        quantity: 25,
        unit: 'pcs',
        minQuantity: 10,
        costPrice: 250,
        sellingPrice: 400,
        gstRate: 18,
      },
      {
        name: 'Brake Pads',
        code: 'BRAKE-001',
        category: 'Brakes',
        quantity: 8,
        unit: 'set',
        minQuantity: 10,
        costPrice: 1800,
        sellingPrice: 2500,
        gstRate: 28,
      },
      {
        name: 'Coolant',
        code: 'COOL-001',
        category: 'Fluids',
        quantity: 40,
        unit: 'ltr',
        minQuantity: 15,
        costPrice: 200,
        sellingPrice: 320,
        gstRate: 18,
      },
    ],
  });

  console.log('✅ Created 5 inventory items (1 low stock alert)');

  // Create appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        customerId: customer1.id,
        serviceType: 'General Service',
        description: 'Complete the pending service tasks',
        date: tomorrow,
        startTime: '10:00',
        endTime: '12:00',
        status: 'confirmed',
        bay: 'Bay 1',
        userId: user1.id,
      },
      {
        customerId: customer3.id,
        serviceType: 'Brake Repair',
        description: 'Final payment and delivery',
        date: nextWeek,
        startTime: '14:00',
        endTime: '15:00',
        status: 'scheduled',
        bay: 'Bay 2',
        userId: user1.id,
      },
    ],
  });

  console.log('✅ Created 2 sample appointments');

  // Create default branding for test user
  await prisma.brandingSettings.create({
    data: {
      userId: user1.id,
      garageName: 'ABC Motors',
      primaryColor: '#C9A84C',
    },
  });

  console.log('✅ Created default branding settings');

  console.log('\n🎉 Database seeding completed!\n');
  console.log('📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    test@garagesaas.com');
  console.log('Password: test123');
  console.log('License:  TEST-1234-ABCD-5678');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📝 Demo Account:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    demo@garagesaas.com');
  console.log('Password: test123');
  console.log('License:  DEMO-9876-WXYZ-4321');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Sample Data Created:');
  console.log('  • 2 Users (test & demo)');
  console.log('  • 3 Customers');
  console.log('  • 3 Vehicles');
  console.log('  • 2 Job Cards (1 in-progress, 1 completed)');
  console.log('  • 2 Invoices (1 paid, 1 partial)');
  console.log('  • 5 Inventory Items (1 low stock)');
  console.log('  • 2 Appointments');
  console.log('\n✨ Ready to test!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
