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
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-luxury-surface-dark via-[#111827] to-[#0A0F1D] text-white border-2 border-luxury-gold/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-luxury-gold/20 border border-luxury-gold flex items-center justify-center text-luxury-gold font-bold">
              ₹
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-luxury-gold uppercase">
                Garage Operating Vault
              </div>
              <div className="text-xs text-slate-400">Monthly Net Cashflow & Settled Invoices</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE LEDGER</span>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 font-mono">
            {formatCurrency(stats?.revenueThisMonth || 0)}
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center text-emerald-400 font-semibold">
              <TrendingUp className="w-4 h-4 mr-1" />
              +{stats?.revenueGrowth || 0}% vs last month
            </span>
            <span className="text-slate-500">•</span>
            <span>{stats?.invoicesThisMonth || 0} Invoices Cleared</span>
          </div>
        </div>

        {/* Banking Metrics Footer Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-black/40 border border-white/5 relative z-10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Jobs</div>
            <div className="text-xl font-bold text-luxury-gold mt-1">{stats?.activeJobCards || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Customers</div>
            <div className="text-xl font-bold text-white mt-1">{stats?.totalCustomers || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Invoices</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats?.pendingInvoices || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding (₹)</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(stats?.outstandingAmount || 0)}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
        <h3 className="text-sm font-bold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction title="🛡️ Express Intake" href="/dashboard/jobcards" />
          <QuickAction title="⚡ Evening Triage" href="/dashboard/jobcards" />
          <QuickAction title="📄 Create Invoice" href="/dashboard/invoices" />
          <QuickAction title="👥 Add Customer" href="/dashboard/customers" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  readonly title: string;
  readonly href: string;
}

function QuickAction({ title, href }: QuickActionProps) {
  return (
    <a
      href={href}
      className="flex items-center justify-center px-4 py-3 bg-luxury-gold/10 text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-ink-light hover:shadow-lg font-medium transition-all duration-300 border border-luxury-gold/30"
    >
      {title}
    </a>
  );
}
