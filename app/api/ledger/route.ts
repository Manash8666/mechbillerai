import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const session = await getSessionUser(request);
    const userId = session?.userId || queryUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID required' }, { status: 401 });
    }

    const period = url.searchParams.get('period') || 'this_month';
    const typeFilter = url.searchParams.get('type'); // "INCOME", "EXPENSE", or null
    const categoryFilter = url.searchParams.get('category');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (url.searchParams.get('startDate') && url.searchParams.get('endDate')) {
      startDate = new Date(url.searchParams.get('startDate')!);
      endDate = new Date(url.searchParams.get('endDate')!);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_week':
          startDate = new Date();
          const day = startDate.getDay();
          const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          break;
        case 'this_fy':
          // Indian FY begins April 1st
          const currentYear = now.getFullYear();
          const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
          startDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0);
          break;
        case 'all':
        default:
          startDate = new Date(2020, 0, 1);
          break;
      }
    }

    // Build where clause
    const whereClause: any = {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (typeFilter && (typeFilter === 'INCOME' || typeFilter === 'EXPENSE')) {
      whereClause.type = typeFilter;
    }

    if (categoryFilter && categoryFilter !== 'all') {
      whereClause.category = categoryFilter;
    }

    // Parallel fetch: Ledger entries, Invoices in range, Inventory items for balance sheet
    const [entries, paidInvoices, allInvoices, inventoryItems] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
      }),
      prisma.invoice.findMany({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
          paid: { gt: 0 },
        },
        select: {
          id: true,
          invoiceNumber: true,
          paid: true,
          paymentMode: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: { userId },
        select: { balance: true, paid: true, paymentMode: true, total: true },
      }),
      prisma.inventoryItem.findMany({
        where: { userId },
        select: { quantity: true, costPrice: true },
      }),
    ]);

    // Financial calculations
    let directIncome = 0;
    let directExpense = 0;
    const categoryTotals: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.type === 'INCOME') {
        directIncome += entry.amount;
      } else {
        directExpense += entry.amount;
        categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.amount;
      }
    }

    const invoicedRevenue = paidInvoices.reduce((acc, inv) => acc + (inv.paid || 0), 0);
    const grossTotalRevenue = directIncome + invoicedRevenue;
    const netOperatingProfit = grossTotalRevenue - directExpense;
    const profitMargin = grossTotalRevenue > 0 ? (netOperatingProfit / grossTotalRevenue) * 100 : 0;

    // Balance Sheet Metrics (Lifetime/Current State)
    let totalCashInflow = 0;
    let totalCashOutflow = 0;
    let totalBankInflow = 0;
    let totalBankOutflow = 0;

    for (const inv of allInvoices) {
      if (inv.paid > 0) {
        if (inv.paymentMode === 'cash') {
          totalCashInflow += inv.paid;
        } else {
          totalBankInflow += inv.paid;
        }
      }
    }

    // Ledger lifetime cash vs bank
    const allLedger = await prisma.ledgerEntry.findMany({
      where: { userId },
      select: { type: true, amount: true, paymentMode: true },
    });

    for (const le of allLedger) {
      const isCash = (le.paymentMode || 'cash').toLowerCase() === 'cash';
      if (le.type === 'INCOME') {
        if (isCash) totalCashInflow += le.amount;
        else totalBankInflow += le.amount;
      } else {
        if (isCash) totalCashOutflow += le.amount;
        else totalBankOutflow += le.amount;
      }
    }

    const cashInHand = Math.max(0, totalCashInflow - totalCashOutflow);
    const bankUpiBalance = Math.max(0, totalBankInflow - totalBankOutflow);
    const accountsReceivable = allInvoices.reduce((acc, inv) => acc + Math.max(0, inv.balance || 0), 0);
    const inventoryValuation = inventoryItems.reduce(
      (acc, item) => acc + (item.quantity > 0 ? item.quantity * item.costPrice : 0),
      0
    );
    const totalCurrentAssets = cashInHand + bankUpiBalance + accountsReceivable + inventoryValuation;

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        directIncome,
        invoicedRevenue,
        grossTotalRevenue,
        directExpense,
        netOperatingProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        entriesCount: entries.length,
      },
      categoryTotals,
      balanceSheet: {
        cashInHand,
        bankUpiBalance,
        accountsReceivable,
        inventoryValuation,
        totalCurrentAssets,
        retainedEarnings: totalCashInflow + totalBankInflow - (totalCashOutflow + totalBankOutflow),
      },
      entries,
    });
  } catch (error) {
    console.error('Error fetching daily ledger:', error);
    return NextResponse.json({ error: 'Internal server error fetching ledger' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    const body = await request.json();
    const { userId: bodyUserId, type, category, amount, paymentMode, description, date, reference, notes } = body;

    const userId = session?.userId || bodyUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID required' }, { status: 401 });
    }

    if (!type || (type !== 'INCOME' && type !== 'EXPENSE')) {
      return NextResponse.json({ error: 'Type must be either INCOME or EXPENSE' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid amount greater than zero is required' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        userId,
        type,
        category: category?.trim() || (type === 'INCOME' ? 'General Income' : 'General Expense'),
        amount: numAmount,
        paymentMode: paymentMode?.toLowerCase() || 'cash',
        description: description.trim(),
        date: date ? new Date(date) : new Date(),
        reference: reference?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    return NextResponse.json({ error: 'Failed to record ledger entry' }, { status: 500 });
  }
}
