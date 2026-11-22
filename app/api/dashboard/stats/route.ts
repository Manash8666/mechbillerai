import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authUser = await getSessionUser(request);
    const requestedUserId = authUser?.userId || searchParams.get('userId');

    if (!requestedUserId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    // Collect all associated workshop partner IDs if MotoFit/Samael/Akshat/Manash
    let targetUserIds = [requestedUserId];
    const userObj = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { email: true },
    });
    const userEmail = (userObj?.email || '').toLowerCase();
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
      targetUserIds = partners.map((p) => p.id);
    }

    const userCondition = targetUserIds.length > 1 ? { in: targetUserIds } : requestedUserId;

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    // Total customers
    const totalCustomers = await prisma.customer.count({
      where: { userId: userCondition },
    });

    // Total invoices this month
    const invoicesThisMonth = await prisma.invoice.count({
      where: {
        userId: userCondition,
        createdAt: { gte: startOfMonth },
      },
    });

    // Revenue this month
    const revenueThisMonth = await prisma.invoice.aggregate({
      where: {
        userId: userCondition,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        total: true,
      },
    });

    // Revenue last month
    const revenueLastMonth = await prisma.invoice.aggregate({
      where: {
        userId: userCondition,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Active job cards
    const activeJobCards = await prisma.jobCard.count({
      where: {
        userId: userCondition,
        status: {
          in: ['pending', 'in-progress'],
        },
      },
    });

    // Pending invoices
    const pendingInvoices = await prisma.invoice.count({
      where: {
        userId: userCondition,
        status: {
          in: ['unpaid', 'partial'],
        },
      },
    });

    // Outstanding amount
    const outstandingAmount = await prisma.invoice.aggregate({
      where: {
        userId: userCondition,
        status: {
          in: ['unpaid', 'partial'],
        },
      },
      _sum: {
        balance: true,
      },
    });

    // Low stock items
    let lowStockCount = 0;
    try {
      const lowStockItems = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM InventoryItem 
        WHERE quantity <= minQuantity
      `;
      lowStockCount = Number(lowStockItems[0]?.count || 0);
    } catch {
      lowStockCount = 0;
    }

    // Today's appointments
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAppointments = await prisma.appointment.count({
      where: {
        userId: userCondition,
        date: {
          gte: today,
          lte: todayEnd,
        },
      },
    });

    // Calculate revenue growth
    const currentRevenue = revenueThisMonth._sum.total || 0;
    const lastRevenue = revenueLastMonth._sum.total || 0;
    const revenueGrowth = lastRevenue > 0 
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
      : 0;

    return NextResponse.json({
      totalCustomers,
      invoicesThisMonth,
      revenueThisMonth: currentRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      activeJobCards,
      pendingInvoices,
      outstandingAmount: outstandingAmount._sum.balance || 0,
      lowStockItems: lowStockCount,
      todayAppointments,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
