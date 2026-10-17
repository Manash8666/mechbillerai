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
      setUser(JSON.parse(userData));
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Job Cards', href: '/dashboard/jobcards', icon: Car },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Branding', href: '/dashboard/settings/branding', icon: Palette },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-luxury-canvas-light dark:bg-luxury-canvas-dark">
      <BrandingLoader />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-luxury-ink-light/60 dark:bg-luxury-ink-dark/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-navy-steel shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-deep-glass ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-deep-glass">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-geek-lime" />
              <div>
                <span className="text-xl font-bold text-pure-white block leading-none">
                  MotoBan
                </span>
                <span className="text-[9px] text-royal-gold uppercase tracking-wider font-semibold">
                  By Hybrid StudioZ
                </span>
              </div>
            </div>
            <button
              className="lg:hidden text-cool-slate hover:text-pure-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-deep-glass bg-void-black/40">
            <p className="text-sm font-medium text-pure-white">{user.name}</p>
            <p className="text-xs text-steel-dim">{user.email}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                  user.licenseStatus === 'active'
                    ? 'bg-emerald-sync/20 text-emerald-sync border-emerald-sync/40'
                    : user.licenseStatus === 'trial'
                    ? 'bg-amber-alert/20 text-amber-alert border-amber-alert/40'
                    : 'bg-crimson-brake/20 text-crimson-brake border-crimson-brake/40'
                }`}
              >
                {user.licenseStatus === 'active'
                  ? 'Active License'
                  : user.licenseStatus === 'trial'
                  ? 'Trial'
                  : 'Expired'}
              </span>
              {user.garageType && (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-royal-gold/15 text-royal-gold border border-royal-gold/30">
                  {user.garageType === 'two_wheeler' ? '🏍️ Two-Wheeler' : '🚗 Four-Wheeler'}
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-geek-lime text-void-black shadow-lime-glow font-bold'
                      : 'text-cool-slate hover:bg-deep-glass hover:text-geek-lime'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-deep-glass">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-crimson-brake hover:bg-crimson-brake/20 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header with theme toggle */}
        <header className="bg-navy-steel shadow-sm px-4 py-4 border-b border-deep-glass flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden text-cool-slate hover:text-pure-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1"></div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-void-black border border-deep-glass hover:border-geek-lime/40 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-cool-slate" />
            ) : (
              <Sun className="h-5 w-5 text-geek-lime" />
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
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
