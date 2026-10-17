'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Loader from '@/components/Loader';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`/api/dashboard/stats?userId=${user.id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Generating" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">Dashboard</h1>
        <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* iOS Banking Vault Hero Card & Quick Stats */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-navy-steel via-[#111827] to-void-black text-white border-2 border-deep-glass shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-geek-lime/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-geek-lime/20 border border-geek-lime flex items-center justify-center text-geek-lime font-bold">
              ₹
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-geek-lime uppercase">
                Garage Operating Vault
              </div>
              <div className="text-xs text-cool-slate">Monthly Net Cashflow & Settled Invoices</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-sync/15 border border-emerald-sync/30 text-emerald-sync text-xs font-bold w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-sync animate-pulse" />
            <span>LIVE LEDGER (EMERALD SYNC)</span>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-geek-lime mb-2 font-mono">
            {formatCurrency(stats?.revenueThisMonth || 0)}
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center text-emerald-sync font-semibold">
              <TrendingUp className="w-4 h-4 mr-1" />
              +{stats?.revenueGrowth || 0}% vs last month
            </span>
            <span className="text-steel-dim">•</span>
            <span className="text-cool-slate">{stats?.invoicesThisMonth || 0} Invoices Cleared</span>
          </div>
        </div>

        {/* Banking Metrics Footer Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-void-black/60 border border-deep-glass relative z-10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-dim">Active Jobs</div>
            <div className="text-xl font-bold text-royal-gold mt-1 font-mono">{stats?.activeJobCards || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-dim">Total Customers</div>
            <div className="text-xl font-bold text-pure-white mt-1 font-mono">{stats?.totalCustomers || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-alert">Pending Invoices</div>
            <div className="text-xl font-bold text-amber-alert mt-1 font-mono">{stats?.pendingInvoices || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-crimson-brake">Outstanding (₹)</div>
            <div className="text-xl font-bold text-crimson-brake mt-1 font-mono">{formatCurrency(stats?.outstandingAmount || 0)}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="bg-navy-steel rounded-xl shadow-lg p-6 border border-deep-glass">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cool-slate mb-4">
          Reactive Garage Shortcuts (v3.0 Telemetry)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            title="🛡️ Express Intake"
            href="/dashboard/jobcards"
            variant="lime"
          />
          <QuickAction
            title="⚡ Evening Triage"
            href="/dashboard/jobcards"
            variant="orange"
          />
          <QuickAction
            title="📄 Create Invoice"
            href="/dashboard/invoices"
            variant="emerald"
          />
          <QuickAction
            title="👥 Add Customer"
            href="/dashboard/customers"
            variant="cobalt"
          />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  readonly title: string;
  readonly href: string;
  readonly variant?: 'lime' | 'orange' | 'emerald' | 'cobalt';
}

function QuickAction({ title, href, variant = 'lime' }: QuickActionProps) {
  const variantStyles = {
    lime: 'bg-geek-lime/10 text-geek-lime border-geek-lime/30 hover:bg-geek-lime hover:text-void-black shadow-sm hover:shadow-lime-glow',
    orange: 'bg-garage-orange/10 text-garage-orange border-garage-orange/30 hover:bg-garage-orange hover:text-white shadow-sm hover:shadow-orange-glow',
    emerald: 'bg-emerald-sync/10 text-emerald-sync border-emerald-sync/30 hover:bg-emerald-sync hover:text-void-black shadow-sm',
    cobalt: 'bg-cobalt-ai/10 text-cobalt-ai border-cobalt-ai/30 hover:bg-cobalt-ai hover:text-white shadow-sm hover:shadow-cobalt-glow',
  };

  return (
    <a
      href={href}
      className={`flex items-center justify-center px-4 py-3 rounded-lg font-bold transition-all duration-300 border ${variantStyles[variant]}`}
    >
      {title}
    </a>
  );
}
