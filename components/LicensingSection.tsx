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
  AlertTriangle,
  Award,
  RefreshCw,
  X,
  Users,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Addon Calculator State (inside upgrade modal)
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [extraUsersCount, setExtraUsersCount] = useState(0);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchLicensingStatus = async () => {
    try {
      setLoading(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(userObj);
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
          setCurrentUser(userObj);
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

  const isMotoFitVip = Boolean(
    data?.isVip ||
    currentUser?.licenseStatus === 'lifetime_free' ||
    currentUser?.email?.toLowerCase().includes('motofit') ||
    currentUser?.email?.toLowerCase().includes('samael') ||
    currentUser?.email?.toLowerCase().includes('akshat') ||
    currentUser?.email?.toLowerCase().includes('manash') ||
    currentUser?.name?.toLowerCase().includes('motofit')
  );

  const handleActivateKey = async (e: React.SyntheticEvent) => {
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
        setCurrentUser(user);
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

  const renderLicenseBadge = () => {
    if (isMotoFitVip) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Award className="h-3.5 w-3.5" /> MotoFit VIP Founder (100% Free Lifetime)
        </span>
      );
    }
    if (data?.isPro) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="h-3.5 w-3.5" /> MotoBan Pro Licensed
        </span>
      );
    }
    if (data?.isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <AlertTriangle className="h-3.5 w-3.5" /> 15-Day Trial Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
        <Clock className="h-3.5 w-3.5" /> 15-Day Free Trial Active ({data?.daysRemaining || 15} Days Left)
      </span>
    );
  };

  // If this is MotoFit 2 / VIP Workshop:
  if (isMotoFitVip) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* MotoFit 2 VIP Elite Lifetime License Card */}
        <div className="bg-gradient-to-br from-[#151D2F] via-[#101726] to-[#0B0F19] rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-amber-500/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-amber-500/20 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-pure-white flex items-center gap-2">
                    MotoFit 2 Enterprise VIP License
                  </h2>
                  <p className="text-xs text-amber-400 font-mono tracking-wider mt-0.5">
                    LICENSE KEY: MOTOBAN-VIP-FOUNDER-01 · PERPETUAL LIFETIME
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Official Founding Partner Garage status active. This workshop operates under an exclusive 
                perpetual VIP commercial agreement with 100% free lifetime access, zero renewal fees, 
                and all enterprise features permanently unlocked.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Lifetime Active
              </span>
            </div>
          </div>

          {/* Auto-Enabled Addons & Enterprise Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 relative z-10">
            <div className="p-4 rounded-xl bg-void-black/60 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-geek-lime/20 border border-geek-lime/40 flex items-center justify-center text-geek-lime">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Seat Seats</div>
                  <div className="text-lg font-bold text-geek-lime">Unlimited Seats</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Auto-enabled for MotoFit 2. Add as many mechanics, advisors, and technicians as needed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-void-black/60 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multi-Location Addons</div>
                  <div className="text-lg font-bold text-emerald-400">Unlimited Locations</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Centralized multi-bay branch syncing and shared vehicle history across all MotoFit outlets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-void-black/60 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Quota</div>
                  <div className="text-lg font-bold text-amber-300">100% Unlimited</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Zero restrictions on bills, estimates, job cards, PDF generation, or WhatsApp alerts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Client View: Clean status card with "Upgrade Plans" modal button
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Subscription Status & Daily Quota Card */}
      <div className="bg-[#151D2F] rounded-2xl shadow-xl p-6 sm:p-8 border border-deep-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-deep-glass">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-pure-white flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-geek-lime" />
                SaaS Subscription & Licensing
              </h2>
              {renderLicenseBadge()}
            </div>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              {data?.isPro
                ? 'Your Pro commercial subscription is active. Enjoy unlimited daily bills, estimates, job cards, counter UPI QR, and WhatsApp dispatch.'
                : 'Free Trial Blueprint: You can generate up to 2 Bills, 2 Estimates, and 2 Job Cards per day. The trial automatically concludes in 15 days.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={() => void fetchLicensingStatus()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-void-black border border-deep-glass hover:border-geek-lime text-slate-200 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-geek-lime text-void-black hover:bg-geek-lime/90 transition-all shadow-lime-glow"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade Plan & Addons
            </button>
          </div>
        </div>

        {/* Daily Quotas Row (if trial) */}
        {!data?.isPro && (
          <div className="mt-6 pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Today&apos;s Trial Quota Usage (Reset at 00:00 midnight)
              </span>
              <span className="text-xs font-medium text-geek-lime">
                Limit: 2 per item / day
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Bills Quota */}
              <div className="p-4 rounded-xl bg-void-black/60 border border-deep-glass">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-200">
                    🧾 Bills / Invoices
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (data?.dailyQuota?.bills?.used || 0) >= 2
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {data?.dailyQuota?.bills?.used || 0} / 2 Used
                  </span>
                </div>
                <div className="w-full bg-void-black h-2 rounded-full overflow-hidden border border-deep-glass">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (data?.dailyQuota?.bills?.used || 0) >= 2 ? 'bg-rose-500' : 'bg-geek-lime'
                    }`}
                    style={{ width: `${Math.min(100, ((data?.dailyQuota?.bills?.used || 0) / 2) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
                  <span>Remaining: {data?.dailyQuota?.bills?.remaining ?? 2}</span>
                  <span>Max: 2/day</span>
                </div>
              </div>

              {/* Estimates Quota */}
              <div className="p-4 rounded-xl bg-void-black/60 border border-deep-glass">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-200">
                    📋 Estimates / Quotes
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (data?.dailyQuota?.estimates?.used || 0) >= 2
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {data?.dailyQuota?.estimates?.used || 0} / 2 Used
                  </span>
                </div>
                <div className="w-full bg-void-black h-2 rounded-full overflow-hidden border border-deep-glass">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (data?.dailyQuota?.estimates?.used || 0) >= 2 ? 'bg-rose-500' : 'bg-geek-lime'
                    }`}
                    style={{ width: `${Math.min(100, ((data?.dailyQuota?.estimates?.used || 0) / 2) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
                  <span>Remaining: {data?.dailyQuota?.estimates?.remaining ?? 2}</span>
                  <span>Max: 2/day</span>
                </div>
              </div>

              {/* Job Cards Quota */}
              <div className="p-4 rounded-xl bg-void-black/60 border border-deep-glass">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-200">
                    🛠️ Job Cards
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (data?.dailyQuota?.jobCards?.used || 0) >= 2
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {data?.dailyQuota?.jobCards?.used || 0} / 2 Used
                  </span>
                </div>
                <div className="w-full bg-void-black h-2 rounded-full overflow-hidden border border-deep-glass">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (data?.dailyQuota?.jobCards?.used || 0) >= 2 ? 'bg-rose-500' : 'bg-geek-lime'
                    }`}
                    style={{ width: `${Math.min(100, ((data?.dailyQuota?.jobCards?.used || 0) / 2) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
                  <span>Remaining: {data?.dailyQuota?.jobCards?.remaining ?? 2}</span>
                  <span>Max: 2/day</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. License Key Activation Card */}
      <div className="bg-[#151D2F] rounded-2xl shadow-xl p-6 sm:p-8 border border-deep-glass">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-pure-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-geek-lime" />
              Activate Commercial License Key
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Have you received a commercial license key? Enter your 16-character license key below to unlock full access.
            </p>
          </div>

          <form onSubmit={handleActivateKey} className="flex-1 max-w-md w-full">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider bg-void-black border border-deep-glass focus:outline-none focus:border-geek-lime text-slate-100 font-mono"
              />
              <button
                type="submit"
                disabled={activating}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-geek-lime text-void-black hover:bg-geek-lime/90 transition-all shrink-0 flex items-center justify-center gap-2"
              >
                {activating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Upgrade Plans & Addons Modal Dialog */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151D2F] border border-deep-glass rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-deep-glass">
              <div>
                <h3 className="text-2xl font-bold text-pure-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-geek-lime" />
                  Upgrade Subscription & Addons
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select a commercial plan or calculate multi-branch addons for your workshop.
                </p>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-deep-glass"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pricing Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Monthly */}
              <div className="rounded-xl p-5 bg-void-black/70 border border-deep-glass flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Monthly</div>
                  <h4 className="text-lg font-bold text-pure-white mt-1">Flexible</h4>
                  <div className="mt-4 pb-4 border-b border-deep-glass">
                    <span className="text-2xl font-extrabold text-pure-white">₹1,299</span>
                    <span className="text-xs text-slate-400"> / mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Unlimited Invoices</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Unlimited Job Cards</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> 1-Tap WhatsApp</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Thermal Printing</li>
                  </ul>
                </div>
                <a
                  href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20subscribe%20to%20the%20Monthly%20Plan%20at%20₹1,299/mo"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full block text-center py-2 px-3 rounded-lg text-xs font-bold bg-deep-glass hover:bg-geek-lime hover:text-void-black transition-all"
                >
                  Choose Monthly
                </a>
              </div>

              {/* Quarterly */}
              <div className="rounded-xl p-5 bg-void-black/70 border border-deep-glass flex flex-col justify-between relative">
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">Save 15%</div>
                <div>
                  <div className="text-xs font-semibold uppercase text-blue-400">Quarterly</div>
                  <h4 className="text-lg font-bold text-pure-white mt-1">Quarterly Plan</h4>
                  <div className="mt-4 pb-4 border-b border-deep-glass">
                    <span className="text-2xl font-extrabold text-pure-white">₹1,099</span>
                    <span className="text-xs text-slate-400"> / mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Everything in Monthly</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Automated Reminders</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Customer Ledger</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Priority Support</li>
                  </ul>
                </div>
                <a
                  href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20subscribe%20to%20the%20Quarterly%20Plan%20at%20₹1,099/mo%20(₹3,297/quarter)"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full block text-center py-2 px-3 rounded-lg text-xs font-bold bg-deep-glass hover:bg-geek-lime hover:text-void-black transition-all"
                >
                  Choose Quarterly
                </a>
              </div>

              {/* Annual (Best Value) */}
              <div className="rounded-xl p-5 bg-void-black/90 border-2 border-geek-lime flex flex-col justify-between relative">
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-geek-lime text-void-black">Save 31%</div>
                <div>
                  <div className="text-xs font-semibold uppercase text-geek-lime">Annual Pro</div>
                  <h4 className="text-lg font-bold text-pure-white mt-1">Best Value</h4>
                  <div className="mt-4 pb-4 border-b border-deep-glass">
                    <span className="text-2xl font-extrabold text-geek-lime">₹899</span>
                    <span className="text-xs text-slate-400"> / mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Everything in Quarterly</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> VAHAN Plate Decoder</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Reorder Alerts</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-geek-lime" /> Custom Subdomain</li>
                  </ul>
                </div>
                <a
                  href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20subscribe%20to%20the%20Annual%20Pro%20Plan%20at%20₹899/mo%20(₹10,788/yr)"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full block text-center py-2 px-3 rounded-lg text-xs font-bold bg-geek-lime text-void-black hover:bg-geek-lime/90 transition-all shadow-lime-glow"
                >
                  Choose Annual
                </a>
              </div>

              {/* Lifetime */}
              <div className="rounded-xl p-5 bg-void-black/70 border border-deep-glass flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase text-purple-400">Lifetime</div>
                  <h4 className="text-lg font-bold text-pure-white mt-1">Perpetual</h4>
                  <div className="mt-4 pb-4 border-b border-deep-glass">
                    <span className="text-2xl font-extrabold text-pure-white">₹15,999</span>
                    <span className="text-xs text-slate-400"> once</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> Permanent Access</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> 2 Yrs Free Updates</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> Zero Renewals</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> Offline SQLite Mode</li>
                  </ul>
                </div>
                <a
                  href="https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20purchase%20the%20One-Time%20Perpetual%20License%20for%20₹15,999"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full block text-center py-2 px-3 rounded-lg text-xs font-bold bg-deep-glass hover:bg-purple-600 hover:text-white transition-all"
                >
                  Buy Lifetime
                </a>
              </div>
            </div>

            {/* Addon Calculator */}
            <div className="mt-6 pt-6 border-t border-deep-glass">
              <h4 className="text-base font-bold text-pure-white flex items-center gap-2">
                <Store className="h-4 w-4 text-geek-lime" /> Multi-Shop & Extra Seat Calculator
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="p-4 rounded-xl bg-void-black/60 border border-deep-glass flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Extra Branches (₹6,999/branch)</div>
                    <div className="text-[11px] text-slate-400">Multi-location inventory sync</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setFranchiseCount(Math.max(0, franchiseCount - 1))} className="w-7 h-7 rounded-lg bg-deep-glass text-white font-bold">-</button>
                    <span className="w-6 text-center font-bold text-geek-lime">{franchiseCount}</span>
                    <button onClick={() => setFranchiseCount(franchiseCount + 1)} className="w-7 h-7 rounded-lg bg-deep-glass text-white font-bold">+</button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-void-black/60 border border-deep-glass flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Extra Staff Seats (₹1,599/seat)</div>
                    <div className="text-[11px] text-slate-400">Above 5 free included users</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExtraUsersCount(Math.max(0, extraUsersCount - 1))} className="w-7 h-7 rounded-lg bg-deep-glass text-white font-bold">-</button>
                    <span className="w-6 text-center font-bold text-geek-lime">{extraUsersCount}</span>
                    <button onClick={() => setExtraUsersCount(extraUsersCount + 1)} className="w-7 h-7 rounded-lg bg-deep-glass text-white font-bold">+</button>
                  </div>
                </div>
              </div>

              {(franchiseCount > 0 || extraUsersCount > 0) && (
                <div className="mt-4 p-4 rounded-xl bg-geek-lime/10 border border-geek-lime/30 flex items-center justify-between">
                  <div className="text-xs text-slate-200">
                    Addon Total: <span className="text-base font-extrabold text-geek-lime">₹{calculateAddonTotal().toLocaleString('en-IN')}</span>
                  </div>
                  <a
                    href={`https://wa.me/916359635416?text=Hi%20MotoBan,%20I%20want%20to%20add%20${franchiseCount}%20branches%20and%20${extraUsersCount}%20extra%20staff%20seats%20(Total:%20₹${calculateAddonTotal()})`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-geek-lime text-void-black hover:bg-geek-lime/90 transition-all shadow-lime-glow"
                  >
                    Order Addon Pack
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
