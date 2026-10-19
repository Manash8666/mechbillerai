import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const session = await getSessionUser(request);
    const body = await request.json().catch(() => ({}));
    const targetUserId = session?.userId || body.userId || queryUserId;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized: User ID required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { branding: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const { mode, confirmPhrase, password } = body;

    if (!mode || (mode !== 'DATA_RESET' && mode !== 'SYSTEM_RESET')) {
      return NextResponse.json(
        { error: 'Invalid reset mode. Must be DATA_RESET or SYSTEM_RESET.' },
        { status: 400 }
      );
    }

    // Security Verification: Require password or strict confirmation phrase
    const requiredPhrase = mode === 'DATA_RESET' ? 'RESET DATA' : 'RESET SYSTEM';
    let isAuthorized = false;

    if (confirmPhrase && confirmPhrase.trim().toUpperCase() === requiredPhrase) {
      isAuthorized = true;
    } else if (password && typeof password === 'string') {
      if (bcrypt.compareSync(password, user.password)) {
        isAuthorized = true;
      } else {
        return NextResponse.json(
          { error: 'Incorrect password provided for confirmation.' },
          { status: 403 }
        );
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: `Please confirm by typing "${requiredPhrase}" or by entering your workshop password.`,
        },
        { status: 400 }
      );
    }

    let summaryStats = {
      invoicesDeleted: 0,
      jobCardsDeleted: 0,
      appointmentsDeleted: 0,
      customersDeleted: 0,
      vehiclesDeleted: 0,
      inventoryDeleted: 0,
    };

    // 1. Transactional Deletions (Cascaded via Prisma or explicit deletion)
    // Delete Invoices & Payments for this user
    const invoices = await prisma.invoice.findMany({
      where: { userId: targetUserId },
      select: { id: true },
    });
    const invoiceIds = invoices.map((i) => i.id);

    if (invoiceIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });
      const delInv = await prisma.invoice.deleteMany({
        where: { userId: targetUserId },
      });
      summaryStats.invoicesDeleted = delInv.count;
    }

    // Delete Job Cards & Tasks for this user
    const jobCards = await prisma.jobCard.findMany({
      where: { userId: targetUserId },
      select: { id: true },
    });
    const jobCardIds = jobCards.map((j) => j.id);

    if (jobCardIds.length > 0) {
      await prisma.jobTask.deleteMany({
        where: { jobCardId: { in: jobCardIds } },
      });
      const delJobs = await prisma.jobCard.deleteMany({
        where: { userId: targetUserId },
      });
      summaryStats.jobCardsDeleted = delJobs.count;
    }

    // Delete Appointments
    const delApp = await prisma.appointment.deleteMany({
      where: { userId: targetUserId },
    });
    summaryStats.appointmentsDeleted = delApp.count;

    // Delete Customers and Vehicles
    const customers = await prisma.customer.findMany({
      where: { userId: targetUserId },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    if (customerIds.length > 0) {
      const vehicles = await prisma.vehicle.findMany({
        where: { customerId: { in: customerIds } },
        select: { id: true },
      });
      const vehicleIds = vehicles.map((v) => v.id);

      if (vehicleIds.length > 0) {
        await prisma.serviceHistory.deleteMany({
          where: { vehicleId: { in: vehicleIds } },
        });
        const delVeh = await prisma.vehicle.deleteMany({
          where: { id: { in: vehicleIds } },
        });
        summaryStats.vehiclesDeleted = delVeh.count;
      }

      const delCust = await prisma.customer.deleteMany({
        where: { userId: targetUserId },
      });
      summaryStats.customersDeleted = delCust.count;
    }

    // Delete Activity Logs
    await prisma.activityLog.deleteMany({
      where: { userId: targetUserId },
    });

    // 2. Extra actions if Factory SYSTEM_RESET
    if (mode === 'SYSTEM_RESET') {
      // Delete Inventory & Suppliers
      const items = await prisma.inventoryItem.findMany({
        where: { userId: targetUserId },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        await prisma.inventoryTransaction.deleteMany({
          where: { itemId: { in: itemIds } },
        });
        const delInvItems = await prisma.inventoryItem.deleteMany({
          where: { userId: targetUserId },
        });
        summaryStats.inventoryDeleted = delInvItems.count;
      }

      await prisma.supplier.deleteMany({
        where: { userId: targetUserId },
      });

      // Reset Branding to MotoFit 2 / MotoBan dark defaults
      await prisma.brandingSettings.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          garageName: 'MotoFit 2 Workshop',
          primaryColor: '#f04923',
          canvasDarkColor: '#0b132b',
          surfaceDarkColor: '#16203d',
          accentColor: '#f04923',
        },
        update: {
          garageName: 'MotoFit 2 Workshop',
          primaryColor: '#f04923',
          canvasDarkColor: '#0b132b',
          surfaceDarkColor: '#16203d',
          accentColor: '#f04923',
        },
      });

      // Reset Team settings to default
      const settingKey = `team_${targetUserId}`;
      await prisma.settings.deleteMany({
        where: { key: settingKey },
      });
    }

    return NextResponse.json({
      success: true,
      mode,
      message:
        mode === 'DATA_RESET'
          ? 'Data Reset successful: All transactional test records cleared.'
          : 'Factory System Reset successful: All data & settings restored to defaults.',
      stats: summaryStats,
    });
  } catch (error) {
    console.error('Error during data/system reset:', error);
    return NextResponse.json(
      { error: 'Internal server error executing reset operation' },
      { status: 500 }
    );
  }
}
