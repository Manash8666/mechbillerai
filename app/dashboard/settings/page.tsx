'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Palette, Bell, Shield, Database, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

import LicensingSection from '@/components/LicensingSection';

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

  const [gstEnabled, setGstEnabled] = useState(false);
  const [loadingGst, setLoadingGst] = useState(false);

  useEffect(() => {
    // Fetch current user GST settings
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id) {
          fetch(`/api/settings?userId=${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data && typeof data.gstEnabled === 'boolean') {
                setGstEnabled(data.gstEnabled);
              }
            })
            .catch(err => console.error(err));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleToggleGST = async () => {
    const nextVal = !gstEnabled;
    setGstEnabled(nextVal);
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id) {
          setLoadingGst(true);
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: u.id, gstEnabled: nextVal }),
          });
          u.gstEnabled = nextVal;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGst(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
          Settings
        </h1>
        <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
          Manage your garage settings, licensing & subscription tiers, MSME tax registration, and preferences
        </p>
      </div>

      {/* SaaS Trial Status, Pricing Tiers & Licensing */}
      <LicensingSection />

      {/* MSME GST Strategic Switch Card */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border-2 border-luxury-gold/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-luxury-gold/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                GST Registered Garage (MSME Status)
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${gstEnabled ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                {gstEnabled ? 'GST Mode (18% Active)' : 'MSME Simplified (0% Tax)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
              Toggle OFF if you are below ₹40L turnover or under the Composition Scheme. Strips away all GST fields across invoices.
            </p>
          </div>
          {/* Neumorphic LED Toggle Switch (from Uiverse by chase2k25) */}
          <div className="switch-container shrink-0">
            <input
              type="checkbox"
              id="gstNeumorphicToggle"
              className="toggle-checkbox"
              checked={gstEnabled}
              disabled={loadingGst}
              onChange={handleToggleGST}
            />
            <label htmlFor="gstNeumorphicToggle" className="switch-label-area" aria-label="Toggle GST Registration">
              <div className="toggle-thumb">
                <div className="led-indicator" />
              </div>
            </label>
          </div>
        </div>

        {/* Live Invoice Preview */}
        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider font-bold text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mb-3">
            Live Invoice Preview ({gstEnabled ? 'Formal GST Invoice' : 'Clean MSME Bill of Supply'})
          </div>
          <div className="rounded-xl bg-luxury-canvas-light/70 dark:bg-luxury-canvas-dark/70 p-4 border border-luxury-gold/20 space-y-2 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">Engine Oil (1L Castrol)</span>
              <span className="font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">₹400</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">Labor Charges (Periodic Service)</span>
              <span className="font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">₹600</span>
            </div>

            {/* Tax breakdown only if GST is enabled */}
            {gstEnabled ? (
              <div className="bg-luxury-gold/10 border border-dashed border-luxury-gold rounded-lg p-3 my-2 space-y-1.5 animate-in fade-in duration-300">
                <div className="flex justify-between text-xs text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">
                  <span>CGST (9%)</span>
                  <span className="font-medium">₹90</span>
                </div>
                <div className="flex justify-between text-xs text-luxury-ink-light/80 dark:text-luxury-ink-dark/80">
                  <span>SGST (9%)</span>
                  <span className="font-medium">₹90</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 my-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>MSME Exemption: No GST added to customer bill</span>
                <span className="font-bold">₹0 Tax</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-luxury-gold/20 font-bold text-base text-luxury-ink-light dark:text-luxury-ink-dark">
              <span>Grand Total</span>
              <span className="text-lg text-luxury-gold">
                {gstEnabled ? '₹1,180' : '₹1,000'}
              </span>
            </div>
          </div>
        </div>
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

interface QuickSettingProps {
  readonly label: string;
  readonly description: string;
  readonly type: 'toggle' | 'select';
  readonly checked?: boolean;
  readonly onToggle?: () => void;
}

function QuickSetting({
  label,
  description,
  type,
  checked,
  onToggle,
}: QuickSettingProps) {
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
