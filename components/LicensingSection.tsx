'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  Store,
  Users,
  AlertTriangle,
  Award,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PearlButton from './PearlButton';

interface DailyQuotaItem {
  used: number;
  remaining: number;
  unlimited: boolean;
}

interface LicensingData {
  licenseStatus: string;
  isVip: boolean;
  isPro: boolean;
  isExpired: boolean;
  daysRemaining: number;
  totalTrialDays: number;
  expiresAt: string | null;
  dailyQuota: {
    limit: number;
    bills: DailyQuotaItem;
    estimates: DailyQuotaItem;
    jobCards: DailyQuotaItem;
  };
  pricingTiers: {
    id: string;
    name: string;
    tagline: string;
    price: number;
    billingCycle: string;
    effectiveMonthlyPrice: number;
    savingsBadge?: string;
    recommended?: boolean;
    features: string[];
  }[];
  addons: {
    franchiseLocation: {
      name: string;
      price: number;
      unit: string;
      description: string;
    };
    extraUser: {
      name: string;
      price: number;
      unit: string;
      description: string;
    };
  };
}

export default function LicensingSection() {
  const [data, setData] = useState<LicensingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activating, setActivating] = useState(false);

  // Addon Calculator State
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [extraUsersCount, setExtraUsersCount] = useState(0);

  const fetchLicensingStatus = async () => {
    try {
      setLoading(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = userObj?.id ? `/api/licensing?userId=${userObj.id}` : '/api/licensing';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // Keep local user in sync if VIP
        if (json.isVip && userObj && userObj.licenseStatus !== 'lifetime_free') {
          userObj.licenseStatus = 'lifetime_free';
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      }
    } catch (err) {
      console.error('Failed to fetch licensing status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLicensingStatus();
  }, []);

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      toast.error('Please enter a license key or VIP Founder key');
      return;
    }

    try {
      setActivating(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');

      const res = await fetch('/api/auth/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          licenseKey: licenseKeyInput.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'License activation failed');
        return;
      }

      toast.success(result.message || 'License activated successfully!');
      setLicenseKeyInput('');
      
      // Update local storage user state
      if (result.user) {
        user.licenseStatus = result.user.licenseStatus;
        localStorage.setItem('user', JSON.stringify(user));
      }

      await fetchLicensingStatus();
    } catch (err) {
      console.error('Activation error:', err);
      toast.error('An error occurred during activation');
    } finally {
      setActivating(false);
    }
  };

  const calculateAddonTotal = () => {
    const franchiseCost = franchiseCount * (data?.addons?.franchiseLocation?.price || 6999);
    const extraUsersCost = extraUsersCount * (data?.addons?.extraUser?.price || 1599);
    return franchiseCost + extraUsersCost;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Trial Status & Daily Quota Dashboard Card */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-luxury-gold/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-luxury-gold/20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-luxury-gold" />
                SaaS Subscription & Licensing
              </h2>
              {data?.isVip ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                  <Award className="h-3.5 w-3.5" /> VIP Founding Garage (100% Free Lifetime)
                </span>
              ) : data?.isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="h-3.5 w-3.5" /> MotoBan Pro Licensed
                </span>
              ) : data?.isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="h-3.5 w-3.5" /> 15-Day Trial Expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40">
                  <Clock className="h-3.5 w-3.5" /> 15-Day Free Trial Active ({data?.daysRemaining || 15} Days Left)
                </span>
              )}
            </div>
            <p className="text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-2 max-w-2xl">
              {data?.isVip
                ? 'Your workshop is designated as an Official Founding Partner Garage. You receive 100% Free Lifetime Full Access to all ecosystem modules, updates, and cloud sync.'
                : data?.isPro
                ? 'Your Pro commercial subscription is active. Enjoy unlimited daily bills, estimates, job cards, counter UPI QR, and WhatsApp dispatch.'
                : 'Free Trial Blueprint: You can generate up to 2 Bills, 2 Estimates, and 2 Job Cards per day. The trial automatically concludes in 15 days.'}
            </p>
          </div>

          <button
            onClick={() => void fetchLicensingStatus()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 hover:border-luxury-gold text-luxury-ink-light dark:text-luxury-ink-dark transition-all shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Quota
          </button>
        </div>

        {/* Daily Quotas Row */}
        {!data?.isVip && !data?.isPro && (
          <div className="mt-6 pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                Today&apos;s Trial Quota Usage (Reset at 00:00 midnight)
              </span>
              <span className="text-xs font-medium text-luxury-gold">
                Limit: 2 per item / day
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Bills Quota */}
              <div className="p-4 rounded-xl bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 border border-luxury-gold/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">
                    🧾 Bills / Invoices
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (data?.dailyQuota?.bills?.used || 0) >= 2
                      ? 'bg-rose-500/20 text-rose-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {data?.dailyQuota?.bills?.used || 0} / 2 Used
                  </span>
                </div>
                <div className="w-full bg-luxury-canvas-light dark:bg-luxury-canvas-dark h-2 rounded-full overflow-hidden border border-luxury-gold/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (data?.dailyQuota?.bills?.used || 0) >= 2 ? 'bg-rose-500' : 'bg-luxury-gold'
                    }`}
                    style={{ width: `${Math.min(100, ((data?.dailyQuota?.bills?.used || 0) / 2) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1.5 flex justify-between">
                  <span>Remaining: {data?.dailyQuota?.bills?.remaining ?? 2}</span>
                  <span>Max: 2/day</span>
                </div>
              </div>

              {/* Estimates Quota */}
              <div className="p-4 rounded-xl bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 border border-luxury-gold/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">
                    📋 Estimates / Quotes
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (data?.dailyQuota?.estimates?.used || 0) >= 2
                      ? 'bg-rose-500/20 text-rose-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {data?.dailyQuota?.estimates?.used || 0} / 2 Used
                  </span>
                </div>
                <div className="w-full bg-luxury-canvas-light dark:bg-luxury-canvas-dark h-2 rounded-full overflow-hidden border border-luxury-gold/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (data?.dailyQuota?.estimates?.used || 0) >= 2 ? 'bg-rose-500' : 'bg-luxury-gold'
                    }`}
                    style={{ width: `${Math.min(100, ((data?.dailyQuota?.estimates?.used || 0) / 2) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1.5 flex justify-between">
                  <span>Remaining: {data?.dailyQuota?.estimates?.remaining ?? 2}</span>
                  <span>Max: 2/day</span>
                </div>
              </div>

              {/* Job Cards Quota */}
              <div className="p-4 rounded-xl bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 border border-luxury-gold/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">
                    🛠️ Job Cards
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (data?.dailyQuota?.jobCards?.used || 0) >= 2
                      ? 'bg-rose-500/20 text-rose-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {data?.dailyQuota?.jobCards?.used || 0} / 2 Used
                  </span>
                </div>
                <div className="w-full bg-luxury-canvas-light dark:bg-luxury-canvas-dark h-2 rounded-full overflow-hidden border border-luxury-gold/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (data?.dailyQuota?.jobCards?.used || 0) >= 2 ? 'bg-rose-500' : 'bg-luxury-gold'
                    }`}
                    style={{ width: `${Math.min(100, ((data?.dailyQuota?.jobCards?.used || 0) / 2) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1.5 flex justify-between">
                  <span>Remaining: {data?.dailyQuota?.jobCards?.remaining ?? 2}</span>
                  <span>Max: 2/day</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Official Pricing Tiers Grid */}
      <div>
        {data?.isVip && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-500/40 shadow-xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="h-4 w-4" /> VIP Founding Partner Garage
            </div>
            <h4 className="text-xl font-bold text-pure-white">
              Permanent 100% Free Lifetime Pro Access Active
            </h4>
            <p className="text-sm text-slate-300 mt-1 max-w-xl mx-auto">
              Your workshop is permanently licensed under Key <code className="text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded">MOTOBAN-VIP-FOUNDER-01</code>. You have unlimited bills, estimates, job cards, and zero renewal fees.
            </p>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-8">
          <h3 className="text-3xl font-extrabold text-luxury-ink-light dark:text-luxury-ink-dark">
            MotoBan Ecosystem Pricing Tiers
          </h3>
          <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-2">
            Engineered exclusively for Indian automotive workshops. Choose the billing rhythm that fuels your workshop&apos;s growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Monthly */}
          <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/20 flex flex-col justify-between shadow-lg hover:border-luxury-gold/50 transition-all duration-300">
            <div>
              <div className="text-sm font-semibold uppercase text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                Monthly Only
              </div>
              <h4 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark mt-1">
                Flexible Monthly
              </h4>
              <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1">
                Zero lock-in, month-to-month freedom
              </p>

              <div className="mt-5 pb-5 border-b border-luxury-gold/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-luxury-ink-light dark:text-luxury-ink-dark">
                    ₹1,299
                  </span>
                  <span className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                    / month
                  </span>
                </div>
                <div className="text-[11px] text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 mt-1">
                  Billed monthly
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlimited Invoices & Bills</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlimited Estimates & Job Cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Dynamic Counter UPI QR (GPay/PhonePe)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1-Tap WhatsApp Bill Dispatch</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>58mm & 80mm Bluetooth Thermal Print</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Up to 5 Staff User Accounts</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-luxury-gold/10">
              <a
                href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20subscribe%20to%20the%20Monthly%20Plan%20at%20₹1,299/mo"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/40 hover:bg-luxury-gold hover:text-luxury-ink-light transition-all"
              >
                Choose Monthly
              </a>
            </div>
          </div>

          {/* Quarterly */}
          <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 flex flex-col justify-between shadow-lg hover:border-luxury-gold/60 transition-all duration-300 relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white shadow-sm">
              Save 15%
            </div>
            <div>
              <div className="text-sm font-semibold uppercase text-blue-500">
                Quarterly
              </div>
              <h4 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark mt-1">
                Quarterly Plan
              </h4>
              <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1">
                Billed ₹3,297 every 3 months
              </p>

              <div className="mt-5 pb-5 border-b border-luxury-gold/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-luxury-ink-light dark:text-luxury-ink-dark">
                    ₹1,099
                  </span>
                  <span className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                    / mo effective
                  </span>
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  ₹3,297 billed quarterly (Save ₹600)
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Everything in Monthly Plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Automated WhatsApp Service Reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>4-Sided Pre-Inspection Dent Shield</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Customer Credit & Ledger Tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Up to 5 Staff User Accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Priority WhatsApp Support</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-luxury-gold/10">
              <a
                href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20subscribe%20to%20the%20Quarterly%20Plan%20at%20₹1,099/mo%20(₹3,297/quarter)"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-all"
              >
                Choose Quarterly
              </a>
            </div>
          </div>

          {/* Yearly (Most Popular) */}
          <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border-2 border-luxury-gold flex flex-col justify-between shadow-2xl relative transform lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-luxury-gold text-luxury-ink-light shadow-md flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Most Popular · Save 31%
            </div>
            <div>
              <div className="text-sm font-semibold uppercase text-luxury-gold">
                Annual Pro
              </div>
              <h4 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark mt-1">
                Yearly Best Value
              </h4>
              <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1">
                Billed ₹10,788 yearly (Just ₹29/day)
              </p>

              <div className="mt-5 pb-5 border-b border-luxury-gold/20">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-luxury-gold">
                    ₹899
                  </span>
                  <span className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                    / mo effective
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                  ₹10,788 billed annually (Save ₹4,800 vs Monthly)
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span className="font-semibold">Everything in Quarterly Plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span>Indian VAHAN / RTO Plate Decoder</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span>Automated Low-Stock & Reorder Alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span>Free Custom Web Subdomain</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span>Multi-Device Real-Time Cloud Sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span>Up to 5 Staff User Accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-luxury-gold shrink-0 mt-0.5" />
                  <span>VIP 24/7 Priority Concierge</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-luxury-gold/20">
              <a
                href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20subscribe%20to%20the%20Annual%20Pro%20Plan%20at%20₹899/mo%20(₹10,788/yr)"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-luxury-gold text-luxury-ink-light hover:bg-luxury-gold/90 transition-all shadow-md"
              >
                Upgrade to Annual (Best Value)
              </a>
            </div>
          </div>

          {/* Lifetime License */}
          <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 flex flex-col justify-between shadow-lg hover:border-luxury-gold/60 transition-all duration-300 relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-sm">
              Zero Renewal Fees
            </div>
            <div>
              <div className="text-sm font-semibold uppercase text-purple-600 dark:text-purple-400">
                One-Time License
              </div>
              <h4 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark mt-1">
                Perpetual License
              </h4>
              <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-1">
                With 2 Years Guaranteed Updates
              </p>

              <div className="mt-5 pb-5 border-b border-luxury-gold/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-luxury-ink-light dark:text-luxury-ink-dark">
                    ₹15,999
                  </span>
                  <span className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                    one-time
                  </span>
                </div>
                <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
                  Commercial Lifetime Ownership
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>2 Years Guaranteed Feature Drops</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>Air-Gapped Offline SQLite Vault Mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>All Pro Features Included Forever</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>Up to 5 Staff User Accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>Zero Monthly or Annual Renewal Fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>VIP On-Premises Onboarding Desk</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-luxury-gold/10">
              <a
                href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20purchase%20the%20One-Time%20Perpetual%20License%20for%20₹15,999"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-all"
              >
                Purchase Lifetime
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Addon Packages & Multi-Location Calculator */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-2xl shadow-xl p-6 sm:p-8 border border-luxury-gold/20">
        <div className="max-w-2xl">
          <h3 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark flex items-center gap-2">
            <Store className="h-6 w-6 text-luxury-gold" />
            Ecosystem Addons & Multi-Shop Calculator
          </h3>
          <p className="text-xs sm:text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
            Tailor your ecosystem for expanding multi-bay franchises and growing mechanic teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Franchise Addon */}
          <div className="p-5 rounded-xl bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 border border-luxury-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                    Franchise / Multi-Location Addon
                  </h4>
                  <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-0.5">
                    Centralized multi-shop inventory transfers & unified vehicle service history
                  </p>
                </div>
                <span className="text-lg font-extrabold text-luxury-gold">
                  ₹6,999
                </span>
              </div>
              <div className="text-[11px] text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 mt-1">
                per additional shop / branch
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-luxury-gold/10 flex items-center justify-between">
              <span className="text-xs font-medium text-luxury-ink-light dark:text-luxury-ink-dark">
                Additional Branches:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFranchiseCount(Math.max(0, franchiseCount - 1))}
                  className="w-7 h-7 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 font-bold text-sm text-luxury-ink-light dark:text-luxury-ink-dark flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-bold text-sm text-luxury-gold w-6 text-center">
                  {franchiseCount}
                </span>
                <button
                  type="button"
                  onClick={() => setFranchiseCount(franchiseCount + 1)}
                  className="w-7 h-7 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 font-bold text-sm text-luxury-ink-light dark:text-luxury-ink-dark flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Extra User Seat Addon */}
          <div className="p-5 rounded-xl bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 border border-luxury-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                    Additional Staff User Seat
                  </h4>
                  <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-0.5">
                    Individual technician & mechanic logins with role permissions (5 users included free)
                  </p>
                </div>
                <span className="text-lg font-extrabold text-luxury-gold">
                  ₹1,599
                </span>
              </div>
              <div className="text-[11px] text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 mt-1">
                per user above 5 staff
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-luxury-gold/10 flex items-center justify-between">
              <span className="text-xs font-medium text-luxury-ink-light dark:text-luxury-ink-dark">
                Seats Above 5:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExtraUsersCount(Math.max(0, extraUsersCount - 1))}
                  className="w-7 h-7 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 font-bold text-sm text-luxury-ink-light dark:text-luxury-ink-dark flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-bold text-sm text-luxury-gold w-6 text-center">
                  {extraUsersCount}
                </span>
                <button
                  type="button"
                  onClick={() => setExtraUsersCount(extraUsersCount + 1)}
                  className="w-7 h-7 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 font-bold text-sm text-luxury-ink-light dark:text-luxury-ink-dark flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Addon Summary */}
        {(franchiseCount > 0 || extraUsersCount > 0) && (
          <div className="mt-6 p-4 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
            <div>
              <div className="text-sm font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                Selected Addons Breakdown:
              </div>
              <div className="text-xs text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-0.5">
                {franchiseCount > 0 && `${franchiseCount} additional branch(es) (₹${(franchiseCount * 6999).toLocaleString('en-IN')})`}
                {franchiseCount > 0 && extraUsersCount > 0 && ' + '}
                {extraUsersCount > 0 && `${extraUsersCount} staff seat(s) (₹${(extraUsersCount * 1599).toLocaleString('en-IN')})`}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 uppercase">Addon Total</div>
                <div className="text-xl font-extrabold text-luxury-gold">₹{calculateAddonTotal().toLocaleString('en-IN')}</div>
              </div>
              <a
                href={`https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20add%20${franchiseCount}%20branches%20and%20${extraUsersCount}%20extra%20staff%20seats%20(Total:%20₹${calculateAddonTotal()})`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-luxury-gold text-luxury-ink-light hover:bg-luxury-gold/90 transition-all shadow-sm"
              >
                Order Addon Pack
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 4. License Key & VIP Founding Activation Card */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-2xl shadow-xl p-6 sm:p-8 border border-luxury-gold/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-luxury-gold" />
              Activate License or VIP Founder Key
            </h3>
            <p className="text-xs sm:text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
              Have you received a commercial license key, or are you one of the 2 Founding Partner Garages? Enter your 16-character license key or VIP Founder Pass below to unlock full access.
            </p>
            <div className="mt-3 text-[11px] text-luxury-ink-light/50 dark:text-luxury-ink-dark/50">
              💡 Founding Partner Garages (<code className="text-luxury-gold">motofit2@garagesaas.com</code> & VIP partner) are whitelisted for 100% Free Lifetime Full Access.
            </div>
          </div>

          <form onSubmit={handleActivateKey} className="flex-1 max-w-md w-full">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-xl text-sm uppercase tracking-wider bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 focus:outline-none focus:border-luxury-gold text-luxury-ink-light dark:text-luxury-ink-dark font-mono"
              />
              <button
                type="submit"
                disabled={activating}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-luxury-gold text-luxury-ink-light hover:bg-luxury-gold/90 transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
              >
                {activating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
