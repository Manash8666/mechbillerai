import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { PRICING_TIERS, ADDONS, isVipFreeGarage, VIP_FOUNDING_KEYS } from '@/lib/licensing';

// GET - Current user's SaaS trial status, daily quotas, and pricing plans
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const auth = await requireAuth(request);
    const userId = auth.user?.userId || queryUserId;

    if (!userId) {
      if (auth.errorResponse) return auth.errorResponse;
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        licenseKey: true,
        licenseStatus: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isVip = user.licenseStatus === 'lifetime_free' || isVipFreeGarage(user.email);
    const isPro = user.licenseStatus === 'active';

    const now = new Date();
    const isExpired = !isVip && !isPro && Boolean(user.expiresAt && now > new Date(user.expiresAt));

    const daysRemaining = isVip || isPro
      ? 9999
      : user.expiresAt
      ? Math.max(0, Math.ceil((new Date(user.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 15;

    // Daily quota calculation (00:00:00 to 23:59:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [billsToday, estimatesToday, jobCardsToday] = await Promise.all([
      prisma.invoice.count({
        where: {
          userId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          NOT: { invoiceNumber: { startsWith: 'EST-' } },
        },
      }),
      prisma.invoice.count({
        where: {
          userId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          invoiceNumber: { startsWith: 'EST-' },
        },
      }),
      prisma.jobCard.count({
        where: {
          userId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    const DAILY_LIMIT = 2;

    return NextResponse.json({
      licenseStatus: isVip ? 'lifetime_free' : isExpired ? 'expired' : user.licenseStatus,
      isVip,
      isPro,
      isExpired,
      daysRemaining,
      totalTrialDays: 15,
      expiresAt: user.expiresAt,
      dailyQuota: {
        limit: DAILY_LIMIT,
        bills: {
          used: billsToday,
          remaining: Math.max(0, DAILY_LIMIT - billsToday),
          unlimited: isVip || isPro,
        },
        estimates: {
          used: estimatesToday,
          remaining: Math.max(0, DAILY_LIMIT - estimatesToday),
          unlimited: isVip || isPro,
        },
        jobCards: {
          used: jobCardsToday,
          remaining: Math.max(0, DAILY_LIMIT - jobCardsToday),
          unlimited: isVip || isPro,
        },
      },
      pricingTiers: PRICING_TIERS,
      addons: ADDONS,
    });
  } catch (error) {
    console.error('Error fetching licensing status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
