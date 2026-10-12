'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Car,
  TrendingUp,
  AlertCircle,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={<Users className="h-6 w-6" />}
          color="bg-luxury-gold"
        />
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobCards || 0}
          icon={<Car className="h-6 w-6" />}
          color="bg-luxury-semantic-warning-light dark:bg-luxury-semantic-warning-dark"
        />
        <StatCard
          title="Invoices (Month)"
          value={stats?.invoicesThisMonth || 0}
          icon={<FileText className="h-6 w-6" />}
          color="bg-luxury-semantic-success-light dark:bg-luxury-semantic-success-dark"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon={<Calendar className="h-6 w-6" />}
          color="bg-luxury-gold-light"
        />
      </div>

      {/* Revenue and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">
              Revenue This Month
            </h3>
            <div className="p-2 bg-luxury-gold/20 rounded-lg">
              <IndianRupee className="h-6 w-6 text-luxury-gold" />
            </div>
          </div>
          <p className="text-3xl font-bold text-luxury-gold mb-2">
            {formatCurrency(stats?.revenueThisMonth || 0)}
          </p>
          <div className="flex items-center text-sm">
            {stats?.revenueGrowth >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-1" />
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark font-medium">
                  +{stats?.revenueGrowth || 0}%
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-luxury-semantic-error-light dark:text-luxury-semantic-error-dark mr-1 rotate-180" />
                <span className="text-luxury-semantic-error-light dark:text-luxury-semantic-error-dark font-medium">
                  {stats?.revenueGrowth || 0}%
                </span>
              </>
            )}
            <span className="text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 ml-2">vs last month</span>
          </div>
        </div>

        {/* Alerts Card */}
        <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">Alerts</h3>
            <AlertCircle className="h-6 w-6 text-luxury-semantic-warning-light dark:text-luxury-semantic-warning-dark" />
          </div>
          <div className="space-y-3">
            <Alert
              title="Pending Invoices"
              value={stats?.pendingInvoices || 0}
              amount={stats?.outstandingAmount || 0}
              color="text-luxury-semantic-warning-light dark:text-luxury-semantic-warning-dark"
            />
            <Alert
              title="Low Stock Items"
              value={stats?.lowStockItems || 0}
              color="text-luxury-semantic-error-light dark:text-luxury-semantic-error-dark"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
        <h3 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction title="New Customer" href="/dashboard/customers" />
          <QuickAction title="Create Job Card" href="/dashboard/jobcards" />
          <QuickAction title="New Invoice" href="/dashboard/invoices" />
          <QuickAction title="Book Appointment" href="/dashboard/appointments" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20 hover:shadow-2xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">{title}</p>
          <p className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">{value}</p>
        </div>
        <div className={`${color} text-luxury-ink-light p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}

function Alert({
  title,
  value,
  amount,
  color,
}: {
  title: string;
  value: number;
  amount?: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-luxury-gold/10 last:border-b-0">
      <span className="text-luxury-ink-light dark:text-luxury-ink-dark">{title}</span>
      <div className="text-right">
        <p className={`font-semibold ${color}`}>{value}</p>
        {amount !== undefined && (
          <p className="text-xs text-luxury-ink-light/50 dark:text-luxury-ink-dark/50">{formatCurrency(amount)}</p>
        )}
      </div>
    </div>
  );
}

function QuickAction({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center px-4 py-3 bg-luxury-gold/10 text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-ink-light hover:shadow-lg font-medium transition-all duration-300 border border-luxury-gold/30"
    >
      {title}
    </a>
  );
}
