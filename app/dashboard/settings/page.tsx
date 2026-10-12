'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Palette, Bell, Shield, Database, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const settingsCategories = [
    {
      name: 'Branding & Customization',
      description: 'Upload logo and customize your brand colors',
      icon: Palette,
      href: '/dashboard/settings/branding',
      badge: 'New',
      color: 'text-luxury-gold',
    },
    {
      name: 'Notifications',
      description: 'Configure email and SMS notification preferences',
      icon: Bell,
      href: '/dashboard/settings/notifications',
      color: 'text-blue-500',
    },
    {
      name: 'Security',
      description: 'Password, two-factor authentication, and security',
      icon: Shield,
      href: '/dashboard/settings/security',
      color: 'text-green-500',
    },
    {
      name: 'Data & Backup',
      description: 'Export data, backup settings, and data management',
      icon: Database,
      href: '/dashboard/settings/data',
      color: 'text-purple-500',
    },
    {
      name: 'Team & Users',
      description: 'Manage staff access and permissions',
      icon: UsersIcon,
      href: '/dashboard/settings/team',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
          Settings
        </h1>
        <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
          Manage your garage settings and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.name}
              href={category.href}
              className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark ${category.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                {category.badge && (
                  <span className="px-2 py-1 bg-luxury-gold text-luxury-ink-light text-xs font-semibold rounded-full">
                    {category.badge}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-2 group-hover:text-luxury-gold transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                {category.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
        <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
          Quick Settings
        </h2>
        <div className="space-y-3">
          <QuickSetting
            label="Dark Mode"
            description="Toggle between light and dark theme"
            type="toggle"
            checked={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <QuickSetting
            label="Language"
            description="English / ગુજરાતી"
            type="select"
          />
          <QuickSetting
            label="Currency"
            description="INR (₹)"
            type="select"
          />
        </div>
      </div>
    </div>
  );
}

function QuickSetting({
  label,
  description,
  type,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  type: 'toggle' | 'select';
  checked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-luxury-gold/10 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark">
          {label}
        </div>
        <div className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
          {description}
        </div>
      </div>
      {type === 'toggle' ? (
        <button 
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked 
              ? 'bg-luxury-gold' 
              : 'bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30'
          }`}
        >
          <span 
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`} 
          />
        </button>
      ) : (
        <button className="px-3 py-1 text-sm bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark rounded border border-luxury-gold/30">
          Change
        </button>
      )}
    </div>
  );
}
