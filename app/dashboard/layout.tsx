'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Users,
  FileText,
  Package,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Palette,
  Moon,
  Sun,
  FileUp,
  FileSpreadsheet,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { BrandingLoader } from '@/components/BrandingLoader';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      
      // Keep dark mode active by default, especially for MotoFit
      if (parsed.email?.toLowerCase().includes('motofit') || parsed.subdomain === 'motofit2') {
        document.documentElement.classList.add('dark');
      }

      // Live-sync license status in case server-side VIP status updated
      const token = localStorage.getItem('motoban_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`/api/licensing?userId=${parsed.id}`, { headers })
        .then((r) => r.json())
        .then((lic) => {
          if (lic?.licenseStatus && lic.licenseStatus !== parsed.licenseStatus) {
            parsed.licenseStatus = lic.licenseStatus;
            localStorage.setItem('user', JSON.stringify(parsed));
            setUser({ ...parsed });
          }
        })
        .catch(() => {});
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('motoban_token');
    router.push('/login');
  };

  const userRole = user?.activeRole || user?.role || 'owner';

  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['owner', 'super_admin', 'manager', 'mechanic', 'technician'] },
    { name: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['owner', 'super_admin', 'manager', 'mechanic', 'technician'] },
    { name: 'Job Cards', href: '/dashboard/jobcards', icon: Car, roles: ['owner', 'super_admin', 'manager', 'mechanic', 'technician'] },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['owner', 'super_admin', 'manager'] },
    { name: 'Daily Ledger', href: '/dashboard/ledger', icon: Wallet, roles: ['owner', 'super_admin', 'manager'] },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['owner', 'super_admin', 'manager'] },
    { name: 'CA Audit Reports', href: '/dashboard/reports', icon: FileSpreadsheet, roles: ['owner', 'super_admin'] },
    { name: 'Import Data', href: '/dashboard/import', icon: FileUp, roles: ['owner', 'super_admin'] },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['owner', 'super_admin', 'manager', 'mechanic', 'technician'] },
    { name: 'Branding', href: '/dashboard/settings/branding', icon: Palette, roles: ['owner', 'super_admin'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['owner', 'super_admin'] },
  ];

  const navigation = allNavigation.filter((item) => item.roles.includes(userRole));

  const mobileBottomTabs = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Job Cards', href: '/dashboard/jobcards', icon: Car },
    { name: 'Billing', href: '/dashboard/invoices', icon: FileText },
    { name: 'Ledger', href: '/dashboard/ledger', icon: Wallet },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] dark:bg-[#0B0F19] text-slate-100 flex flex-col">
      <BrandingLoader />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-navy-steel shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-deep-glass ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header & Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-deep-glass">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-geek-lime/15 border border-geek-lime/40 flex items-center justify-center text-geek-lime shadow-lime-glow">
                <Car className="h-6 w-6 text-geek-lime" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-pure-white block leading-none tracking-tight">
                  MotoBan
                </span>
                <span className="text-[9px] text-royal-gold uppercase tracking-wider font-semibold block mt-1">
                  Powered by Hybrid StudioZ
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-lg text-cool-slate hover:text-pure-white hover:bg-deep-glass transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Workshop Crest & VIP Status */}
          <div className="px-5 py-4 border-b border-deep-glass bg-void-black/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-geek-lime/30 to-garage-orange/30 border border-royal-gold/40 flex items-center justify-center text-pure-white font-bold text-sm shrink-0">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'MB'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-pure-white truncate">{user.name}</p>
                <p className="text-xs text-steel-dim truncate">{user.email}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                  user.licenseStatus === 'lifetime_free'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : user.licenseStatus === 'active'
                    ? 'bg-emerald-sync/20 text-emerald-sync border-emerald-sync/40'
                    : user.licenseStatus === 'trial'
                    ? 'bg-amber-alert/20 text-amber-alert border-amber-alert/40'
                    : 'bg-crimson-brake/20 text-crimson-brake border-crimson-brake/40'
                }`}
              >
                {user.licenseStatus === 'lifetime_free'
                  ? '👑 VIP Lifetime Free'
                  : user.licenseStatus === 'active'
                  ? 'Active License'
                  : user.licenseStatus === 'trial'
                  ? 'Trial'
                  : 'Expired'}
              </span>
              <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-full bg-geek-lime/15 text-geek-lime border border-geek-lime/30 capitalize">
                {userRole === 'owner' ? '👑 Owner' : userRole === 'manager' ? '📋 Manager' : '🔧 Technician'}
              </span>
              {user.garageType && (
                <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-full bg-royal-gold/15 text-royal-gold border border-royal-gold/30">
                  {user.garageType === 'two_wheeler' ? '🏍️ Two-Wheeler' : '🚗 Four-Wheeler'}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                    isActive
                      ? 'bg-geek-lime text-void-black shadow-lime-glow font-bold'
                      : 'text-cool-slate hover:bg-deep-glass hover:text-geek-lime'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="p-4 border-t border-deep-glass bg-void-black/40">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3.5 py-2.5 w-full rounded-xl text-crimson-brake hover:bg-crimson-brake/20 transition-all duration-200 font-bold text-sm"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Header: Sticky on Mobile & Desktop */}
        <header className="sticky top-0 z-30 bg-navy-steel/95 backdrop-blur-md px-3.5 sm:px-6 py-3 border-b border-deep-glass flex items-center justify-between gap-3 shadow-md">
          {/* Mobile Left: Menu Toggle + Brand */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 rounded-xl bg-void-black/60 border border-deep-glass text-cool-slate hover:text-pure-white transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-geek-lime" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-geek-lime/15 border border-geek-lime/40 flex items-center justify-center text-geek-lime">
                <Car className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold text-pure-white tracking-tight block">MotoBan</span>
                <span className="text-[10px] text-royal-gold font-bold block truncate max-w-[120px]">
                  {user?.name || 'Workshop'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Left: Breadcrumb / Active Page Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-steel-dim">
            <span className="text-cool-slate">Workshop Management</span>
            <span>/</span>
            <span className="text-geek-lime capitalize">{pathname.replace('/dashboard', '').replace('/', '') || 'Overview'}</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* VIP Status Pill (Compact on Mobile) */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>MotoFit Live</span>
            </span>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-void-black border border-deep-glass hover:border-geek-lime/40 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to dark midnight mode'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-cool-slate" />
              ) : (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-geek-lime" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content with Responsive Mobile Padding */}
        <main className="p-3.5 sm:p-5 lg:p-8 pb-28 lg:pb-12 max-w-7xl mx-auto w-full overflow-x-hidden flex-1">
          {children}
        </main>

        {/* Sticky Mobile Bottom Navigation Bar (Visible only on < lg screens) */}
        <nav
          className="fixed bottom-0 inset-x-0 z-30 bg-navy-steel/95 backdrop-blur-md border-t border-deep-glass lg:hidden safe-area-bottom shadow-2xl"
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-5 h-16 items-center px-1">
            {mobileBottomTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
                    isActive ? 'text-geek-lime font-bold' : 'text-cool-slate hover:text-pure-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110 text-geek-lime' : ''}`} />
                  <span className="text-[10px] mt-1 font-semibold tracking-tight">{tab.name}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-geek-lime mt-0.5 shadow-lime-glow" />}
                </Link>
              );
            })}

            {/* 5th Tab: Menu trigger to open complete drawer */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1 rounded-lg text-cool-slate hover:text-pure-white transition-colors"
              aria-label="Open full drawer"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-semibold tracking-tight">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <DashboardContent>{children}</DashboardContent>
    </ThemeProvider>
  );
}
