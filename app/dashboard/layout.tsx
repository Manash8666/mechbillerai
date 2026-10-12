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

  const handleLogout = () => {
    localStorage.removeItem('user');
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
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-luxury-surface-light dark:bg-luxury-surface-dark shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-luxury-gold/20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gold/20">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-luxury-gold" />
              <span className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">Garage SaaS</span>
            </div>
            <button
              className="lg:hidden text-luxury-ink-light dark:text-luxury-ink-dark"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-luxury-gold/20 bg-luxury-canvas-light/50 dark:bg-luxury-canvas-dark/50">
            <p className="text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark">{user.name}</p>
            <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">{user.email}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  user.licenseStatus === 'active'
                    ? 'bg-luxury-semantic-success-light dark:bg-luxury-semantic-success-dark text-luxury-ink-light'
                    : user.licenseStatus === 'trial'
                    ? 'bg-luxury-semantic-warning-light dark:bg-luxury-semantic-warning-dark text-luxury-ink-light'
                    : 'bg-luxury-semantic-error-light dark:bg-luxury-semantic-error-dark text-luxury-ink-light'
                }`}
              >
                {user.licenseStatus === 'active'
                  ? 'Active License'
                  : user.licenseStatus === 'trial'
                  ? 'Trial'
                  : 'Expired'}
              </span>
              {user.garageType && (
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-luxury-gold/20 text-luxury-gold">
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
                      ? 'bg-luxury-gold text-luxury-ink-light shadow-lg'
                      : 'text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 hover:bg-luxury-canvas-light/50 dark:hover:bg-luxury-canvas-dark/50 hover:text-luxury-gold'
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
          <div className="px-4 py-4 border-t border-luxury-gold/20">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-luxury-semantic-error-light dark:text-luxury-semantic-error-dark hover:bg-luxury-semantic-error-light/20 dark:hover:bg-luxury-semantic-error-dark/20 transition-all duration-200"
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
        <header className="bg-luxury-surface-light dark:bg-luxury-surface-dark shadow-sm px-4 py-4 border-b border-luxury-gold/20 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden text-luxury-ink-light dark:text-luxury-ink-dark"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1"></div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/20 hover:border-luxury-gold/50 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-luxury-ink-light" />
            ) : (
              <Sun className="h-5 w-5 text-luxury-ink-dark" />
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
