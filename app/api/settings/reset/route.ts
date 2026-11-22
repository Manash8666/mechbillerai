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
    let targetUserId = session?.userId || body.userId || queryUserId;

    if (!targetUserId) {
      // Fallback: check if password matches any workshop admin
      if (body.password && typeof body.password === 'string') {
        const allUsers = await prisma.user.findMany();
        for (const u of allUsers) {
          if (u.password && bcrypt.compareSync(body.password.trim(), u.password)) {
            targetUserId = u.id;
            break;
          }
        }
      }
      if (!targetUserId) {
        const primaryOwner = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: 'motofit' } },
              { email: { contains: 'manash' } },
              { email: { contains: 'samael' } },
              { role: 'owner' },
            ],
          },
        });
        if (primaryOwner) targetUserId = primaryOwner.id;
      }
    }

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

    // Collect all associated workshop partner IDs if MotoFit/Samael/Akshat
    const targetUserIds = [targetUserId];
    const userEmail = (user.email || '').toLowerCase();
    if (
      userEmail.includes('motofit') ||
      userEmail.includes('manash') ||
      userEmail.includes('samael') ||
      userEmail.includes('akshat')
    ) {
      const partners = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'motofit' } },
            { email: { contains: 'manash' } },
            { email: { contains: 'samael' } },
            { email: { contains: 'akshat' } },
          ],
        },
        select: { id: true },
      });
      for (const p of partners) {
        if (!targetUserIds.includes(p.id)) targetUserIds.push(p.id);
      }
    }

    // Security Verification: Require strict confirmation phrase or password
    const requiredPhrase = mode === 'DATA_RESET' ? 'RESET DATA' : 'RESET SYSTEM';
    let isAuthorized = false;

    const cleanPhrase = (confirmPhrase || '').replace(/['"]/g, '').trim().toUpperCase();
    if (cleanPhrase === requiredPhrase) {
      isAuthorized = true;
    } else if (password && typeof password === 'string' && password.trim().length > 0) {
      const candidateUsers = await prisma.user.findMany({
        where: { id: { in: targetUserIds } },
      });
      const pwMatches = candidateUsers.some(
        (cu) => cu.password && bcrypt.compareSync(password.trim(), cu.password)
      );
      if (pwMatches) {
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

    const summaryStats = {
      invoicesDeleted: 0,
      jobCardsDeleted: 0,
      appointmentsDeleted: 0,
      customersDeleted: 0,
      vehiclesDeleted: 0,
      inventoryDeleted: 0,
      ledgerDeleted: 0,
    };

    // 1. Invoices & Payments Deletion (Child records first to avoid foreign key violations)
    const invoices = await prisma.invoice.findMany({
      where: { userId: { in: targetUserIds } },
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
        where: { id: { in: invoiceIds } },
      });
      summaryStats.invoicesDeleted = delInv.count;
    }

    // 2. JobCards & Tasks Deletion
    const jobCards = await prisma.jobCard.findMany({
      where: { userId: { in: targetUserIds } },
      select: { id: true },
    });
    const jobCardIds = jobCards.map((j) => j.id);

    if (jobCardIds.length > 0) {
      // Clear any remaining invoices referencing these jobCards
      const remainingJobInvoices = await prisma.invoice.findMany({
        where: { jobCardId: { in: jobCardIds } },
        select: { id: true },
      });
      const remInvIds = remainingJobInvoices.map((i) => i.id);
      if (remInvIds.length > 0) {
        await prisma.payment.deleteMany({ where: { invoiceId: { in: remInvIds } } });
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: remInvIds } } });
        await prisma.invoice.deleteMany({ where: { id: { in: remInvIds } } });
      }

      await prisma.jobTask.deleteMany({
        where: { jobCardId: { in: jobCardIds } },
      });
      const delJobs = await prisma.jobCard.deleteMany({
        where: { id: { in: jobCardIds } },
      });
      summaryStats.jobCardsDeleted = delJobs.count;
    }

    // 3. Appointments Deletion
    const delApp = await prisma.appointment.deleteMany({
      where: { userId: { in: targetUserIds } },
    });
    summaryStats.appointmentsDeleted = delApp.count;

    // 4. Customers & Vehicles Deletion
    const customers = await prisma.customer.findMany({
      where: { userId: { in: targetUserIds } },
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
        // Clear any remaining job cards linked to these vehicles
        const vehJobs = await prisma.jobCard.findMany({
          where: { vehicleId: { in: vehicleIds } },
          select: { id: true },
        });
        const vehJobIds = vehJobs.map((j) => j.id);
        if (vehJobIds.length > 0) {
          await prisma.jobTask.deleteMany({ where: { jobCardId: { in: vehJobIds } } });
          await prisma.jobCard.deleteMany({ where: { id: { in: vehJobIds } } });
        }

        await prisma.serviceHistory.deleteMany({
          where: { vehicleId: { in: vehicleIds } },
        });
        const delVeh = await prisma.vehicle.deleteMany({
          where: { id: { in: vehicleIds } },
        });
        summaryStats.vehiclesDeleted = delVeh.count;
      }

      const delCust = await prisma.customer.deleteMany({
        where: { id: { in: customerIds } },
      });
      summaryStats.customersDeleted = delCust.count;
    }

    // 5. Daily Ledger Entries Deletion
    try {
      const delLedger = await prisma.ledgerEntry.deleteMany({
        where: { userId: { in: targetUserIds } },
      });
      summaryStats.ledgerDeleted = delLedger.count;
    } catch (ledgerErr) {
      console.warn('Ledger cleanup notice:', ledgerErr);
    }

    // 6. Activity Logs Deletion
    await prisma.activityLog.deleteMany({
      where: { userId: { in: targetUserIds } },
    });

    // 7. Extra actions if Factory SYSTEM_RESET
    if (mode === 'SYSTEM_RESET') {
      const items = await prisma.inventoryItem.findMany({
        where: { userId: { in: targetUserIds } },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        await prisma.inventoryTransaction.deleteMany({
          where: { itemId: { in: itemIds } },
        });
        const delInvItems = await prisma.inventoryItem.deleteMany({
          where: { id: { in: itemIds } },
        });
        summaryStats.inventoryDeleted = delInvItems.count;
      }

      await prisma.supplier.deleteMany({
        where: { userId: { in: targetUserIds } },
      });

      // Reset Branding & Team for all target workshop users
      for (const uid of targetUserIds) {
        await prisma.brandingSettings.upsert({
          where: { userId: uid },
          create: {
            userId: uid,
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

        const settingKey = `team_${uid}`;
        await prisma.settings.deleteMany({
          where: { key: settingKey },
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode,
      message:
        mode === 'DATA_RESET'
          ? 'Data Reset successful: All transactional test records, invoices, job cards, ledger, and customers cleared.'
          : 'Factory System Reset successful: All data & settings restored to factory defaults.',
      stats: summaryStats,
    });
  } catch (error: any) {
    console.error('Error during data/system reset:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error executing reset operation' },
      { status: 500 }
    );
  }
}
