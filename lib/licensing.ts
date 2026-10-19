import { prisma } from '@/lib/prisma';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time' | 'trial';
  effectiveMonthlyPrice: number;
  savingsBadge?: string;
  features: string[];
  recommended?: boolean;
}

export const PRICING_TIERS: PricingPlan[] = [
  {
    id: 'trial',
    name: '15-Day Free Trial',
    tagline: 'Test drive the smart garage ecosystem',
    price: 0,
    billingCycle: 'trial',
    effectiveMonthlyPrice: 0,
    features: [
      '15 Days Full Access',
      'Max 2 Bills / Day',
      'Max 2 Estimates / Day',
      'Max 2 Job Cards / Day',
      'Single Garage Location',
      'Up to 2 Staff Logins',
      'Standard 58mm Thermal Slip',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    tagline: 'Flexible month-to-month billing',
    price: 1299,
    billingCycle: 'monthly',
    effectiveMonthlyPrice: 1299,
    features: [
      'Unlimited Invoices & Bills',
      'Unlimited Estimates & Job Cards',
      'Dynamic Counter UPI QR (GPay/PhonePe)',
      '1-Tap WhatsApp Bill Dispatch',
      '58mm & 80mm Bluetooth Thermal Print',
      'Up to 5 Staff User Accounts',
      'Standard Email & In-App Support',
    ],
  },
  {
    id: 'quarterly',
    name: 'Quarterly Plan',
    tagline: 'Billed ₹3,297 every 3 months',
    price: 3297,
    billingCycle: 'quarterly',
    effectiveMonthlyPrice: 1099,
    savingsBadge: 'Save 15%',
    features: [
      'Everything in Monthly',
      'Automated WhatsApp Service Reminders',
      'Pre-Inspection 4-Sided Dent Photo Shield',
      'Customer Credit & Ledger Tracking',
      'Up to 5 Staff User Accounts',
      'Priority Support Assistance',
    ],
  },
  {
    id: 'yearly',
    name: 'Annual Pro Plan',
    tagline: 'Billed ₹10,788 yearly (Best Value)',
    price: 10788,
    billingCycle: 'yearly',
    effectiveMonthlyPrice: 899,
    savingsBadge: 'Save 31% - Most Popular',
    recommended: true,
    features: [
      'Everything in Quarterly',
      'Free Custom Domain Connection (yourgarage.motoban.in)',
      'Full Indian VAHAN / RTO Authority Plate Decoder',
      'Inventory Reorder & Low-Stock Alerts',
      'Multi-Device Real-Time Cloud Sync',
      'Up to 5 Staff User Accounts',
      'VIP 24/7 Dedicated Support',
    ],
  },
  {
    id: 'lifetime',
    name: 'One-Time Perpetual License',
    tagline: 'Lifetime License with 2 Years Updates',
    price: 15999,
    billingCycle: 'one_time',
    effectiveMonthlyPrice: 0,
    savingsBadge: 'Zero Recurring Fees',
    features: [
      'Lifetime Commercial Ownership',
      '2 Years Guaranteed Updates & Feature Drops',
      'Local Offline Vault Mode (SQLite / Air-gapped)',
      'All Pro Features Included Forever',
      'Up to 5 Staff User Accounts',
      'Zero Cloud Renewal Fees',
      'VIP Priority Implementation Desk',
    ],
  },
];

export const ADDONS = {
  franchiseLocation: {
    name: 'Franchise / Multi-Location Addon',
    price: 6999,
    unit: 'per additional shop / branch',
    description: 'Centralized multi-bay reporting, shared vehicle service history, and cross-garage inventory transfers.',
  },
  extraUser: {
    name: 'Additional Staff User Seat',
    price: 1599,
    unit: 'per user above 5 staff',
    description: 'Independent mechanic/technician login with customizable role-based permissions.',
  },
};

/**
 * List of VIP Founding Garages with 100% Free Lifetime Full Access
 * Can be customized via environment variable VIP_FREE_GARAGES (comma-separated emails)
 */
export const VIP_FOUNDING_GARAGES: string[] = [
  'garage2motofit@gmail.com', // Primary Laboratory: MotoFit 2 Workshop, Ahmedabad
  'motofit2@garagesaas.com', // Legacy Alias
  'vipgarage@motoban.in',     // Second Founding Garage
  ...(process.env.VIP_FREE_GARAGES ? process.env.VIP_FREE_GARAGES.split(',').map((e) => e.trim().toLowerCase()) : []),
];

export const VIP_FOUNDING_KEYS = [
  'MOTOBAN-VIP-FOUNDER-01', // MotoFit 2 Lifetime Key
  'MOTOBAN-VIP-FOUNDER-02',
];

/**
 * Checks whether an email belongs to the 2 VIP Free Founding Garages
 */
export function isVipFreeGarage(email: string): boolean {
  if (!email) return false;
  return VIP_FOUNDING_GARAGES.includes(email.toLowerCase().trim());
}

export interface QuotaCheckResult {
  allowed: boolean;
  code?: 'ACTIVE_PLAN' | 'LIFETIME_FREE' | 'DAILY_QUOTA_EXCEEDED' | 'TRIAL_EXPIRED' | 'USER_NOT_FOUND';
  reason?: string;
  usedToday?: number;
  dailyLimit?: number;
  daysRemaining?: number;
  tierInfo?: {
    licenseStatus: string;
    expiresAt: Date | null;
  };
}

/**
 * Enforces the 15-Day Trial & Daily Quota Blueprint:
 * - Max 2 Bills / day
 * - Max 2 Estimates / day
 * - Max 2 Job Cards / day
 * - 15 Calendar Days duration
 * - Active or Lifetime Free plans have UNLIMITED access
 */
export async function checkTrialQuota(
  userId: string,
  actionType: 'BILL' | 'ESTIMATE' | 'JOBCARD'
): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      licenseStatus: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      code: 'USER_NOT_FOUND',
      reason: 'User account not found',
    };
  }

  // 1. VIP Free Founding Garages & Active Pro Licenses have UNLIMITED access
  if (user.licenseStatus === 'lifetime_free' || isVipFreeGarage(user.email)) {
    return {
      allowed: true,
      code: 'LIFETIME_FREE',
      tierInfo: { licenseStatus: 'lifetime_free', expiresAt: null },
    };
  }

  if (user.licenseStatus === 'active') {
    return {
      allowed: true,
      code: 'ACTIVE_PLAN',
      tierInfo: { licenseStatus: 'active', expiresAt: user.expiresAt },
    };
  }

  // 2. 15-Day Trial Expiration Check
  const now = new Date();
  if (user.expiresAt && now > new Date(user.expiresAt)) {
    // Auto-update to expired if not yet marked
    if (user.licenseStatus !== 'expired') {
      await prisma.user.update({
        where: { id: userId },
        data: { licenseStatus: 'expired' },
      });
    }

    return {
      allowed: false,
      code: 'TRIAL_EXPIRED',
      reason:
        'Your 15-day free trial has expired. Please upgrade to a licensed plan (Monthly ₹1,299 or Yearly ₹899/mo) to continue issuing bills and job cards.',
      daysRemaining: 0,
      tierInfo: { licenseStatus: 'expired', expiresAt: user.expiresAt },
    };
  }

  const daysRemaining = user.expiresAt
    ? Math.max(0, Math.ceil((new Date(user.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 15;

  // 3. Daily Quota Check (Start and End of today in local date)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const DAILY_LIMIT = 2; // Strict 2 Bills, 2 Estimates, 2 Job Cards per day

  if (actionType === 'BILL') {
    const billsToday = await prisma.invoice.count({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        NOT: {
          invoiceNumber: {
            startsWith: 'EST-',
          },
        },
      },
    });

    if (billsToday >= DAILY_LIMIT) {
      return {
        allowed: false,
        code: 'DAILY_QUOTA_EXCEEDED',
        reason: `Trial daily quota reached: You can create a maximum of 2 Bills per day during your 15-day trial (Used: ${billsToday}/${DAILY_LIMIT} today). Upgrade to MotoBan Pro for unlimited bills.`,
        usedToday: billsToday,
        dailyLimit: DAILY_LIMIT,
        daysRemaining,
        tierInfo: { licenseStatus: user.licenseStatus, expiresAt: user.expiresAt },
      };
    }

    return {
      allowed: true,
      usedToday: billsToday,
      dailyLimit: DAILY_LIMIT,
      daysRemaining,
    };
  }

  if (actionType === 'ESTIMATE') {
    // Count invoices acting as quotes/estimates (prefixed with EST-)
    const estimatesToday = await prisma.invoice.count({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        invoiceNumber: {
          startsWith: 'EST-',
        },
      },
    });

    if (estimatesToday >= DAILY_LIMIT) {
      return {
        allowed: false,
        code: 'DAILY_QUOTA_EXCEEDED',
        reason: `Trial daily quota reached: You can create a maximum of 2 Estimates per day during your 15-day trial (Used: ${estimatesToday}/${DAILY_LIMIT} today). Upgrade to MotoBan Pro for unlimited estimates.`,
        usedToday: estimatesToday,
        dailyLimit: DAILY_LIMIT,
        daysRemaining,
        tierInfo: { licenseStatus: user.licenseStatus, expiresAt: user.expiresAt },
      };
    }

    return {
      allowed: true,
      usedToday: estimatesToday,
      dailyLimit: DAILY_LIMIT,
      daysRemaining,
    };
  }

  if (actionType === 'JOBCARD') {
    const jobCardsToday = await prisma.jobCard.count({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (jobCardsToday >= DAILY_LIMIT) {
      return {
        allowed: false,
        code: 'DAILY_QUOTA_EXCEEDED',
        reason: `Trial daily quota reached: You can create a maximum of 2 Job Cards per day during your 15-day trial (Used: ${jobCardsToday}/${DAILY_LIMIT} today). Upgrade to MotoBan Pro for unlimited job cards.`,
        usedToday: jobCardsToday,
        dailyLimit: DAILY_LIMIT,
        daysRemaining,
        tierInfo: { licenseStatus: user.licenseStatus, expiresAt: user.expiresAt },
      };
    }

    return {
      allowed: true,
      usedToday: jobCardsToday,
      dailyLimit: DAILY_LIMIT,
      daysRemaining,
    };
  }

  return { allowed: true };
}
