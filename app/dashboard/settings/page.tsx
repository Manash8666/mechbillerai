'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Palette,
  Bell,
  Shield,
  Database,
  Users as UsersIcon,
  FileSpreadsheet,
  Building2,
  User,
  Phone,
  Save,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import toast from 'react-hot-toast';

import LicensingSection from '@/components/LicensingSection';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [gstEnabled, setGstEnabled] = useState(false);
  const [loadingGst, setLoadingGst] = useState(false);

  // Identity state (Name Change)
  const [profileName, setProfileName] = useState('');
  const [garageName, setGarageName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingIdentity, setSavingIdentity] = useState(false);

  const settingsCategories = [
    {
      name: 'CA Audit Reports',
      description: 'Quarterly, Half-Yearly & Annual GSTR tax schedules for your CA',
      icon: FileSpreadsheet,
      href: '/dashboard/reports',
      badge: 'CA Tax Hub',
      color: 'text-emerald-400',
    },
    {
      name: 'Team & PIN Reset',
      description: 'Manage mechanics, advisors, and quick 4-digit mobile PINs',
      icon: UsersIcon,
      href: '/dashboard/settings/team',
      badge: '4-Digit PINs',
      color: 'text-orange-500',
    },
    {
      name: 'Security & Password',
      description: 'Workshop password reset, bcrypt credentials, and HMAC keys',
      icon: Shield,
      href: '/dashboard/settings/security',
      badge: 'Password Reset',
      color: 'text-green-500',
    },
    {
      name: 'Data Reset & Backup',
      description: 'Data Reset (clear test bills) and full Factory System Reset',
      icon: Database,
      href: '/dashboard/settings/data',
      badge: 'System Reset',
      color: 'text-purple-500',
    },
    {
      name: 'Branding & Payment QR',
      description: 'Upload logo, personal GPay / PhonePe QR standee, and custom theme',
      icon: Palette,
      href: '/dashboard/settings/branding',
      badge: 'QR & Colors',
      color: 'text-luxury-gold',
    },
    {
      name: 'Notifications',
      description: 'Configure email and SMS notification preferences',
      icon: Bell,
      href: '/dashboard/settings/notifications',
      color: 'text-blue-500',
    },
  ];

  useEffect(() => {
    // Fetch current user settings & identity
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setProfileName(u.name || '');
        setPhone(u.phone || '');
        if (u.id) {
          fetch(`/api/settings?userId=${u.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && typeof data.gstEnabled === 'boolean') {
                setGstEnabled(data.gstEnabled);
              }
              if (data.name) setProfileName(data.name);
              if (data.phone) setPhone(data.phone);
              if (data.branding?.garageName) {
                setGarageName(data.branding.garageName);
              } else if (u.name?.toLowerCase().includes('motofit')) {
                setGarageName('MotoFit 2 Workshop');
              }
            })
            .catch((err) => console.error(err));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleUpdateIdentity = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Profile Name cannot be empty');
      return;
    }

    try {
      setSavingIdentity(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: userObj?.id,
          name: profileName.trim(),
          garageName: garageName.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (userObj) {
          userObj.name = profileName.trim();
          userObj.phone = phone.trim();
          if (garageName.trim()) {
            userObj.garageName = garageName.trim();
          }
          localStorage.setItem('user', JSON.stringify(userObj));
        }
        toast.success('Name & Workshop Identity updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update name');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating identity');
    } finally {
      setSavingIdentity(false);
    }
  };

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
          toast.success(nextVal ? 'GST Mode Enabled (18% Breakdown)' : 'MSME Simplified Mode Enabled (0% Tax)');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGst(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
          Settings & Workshop Hub
        </h1>
        <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
          Manage your garage identity, password & PIN resets, CA audit schedules, and system preferences.
        </p>
      </div>

      {/* SaaS Trial Status, Pricing Tiers & Licensing */}
      <LicensingSection />

      {/* Workshop & Owner Identity Card (NAME CHANGE) */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border-2 border-luxury-gold/40">
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-luxury-gold/20">
          <div>
            <h2 className="text-lg font-bold text-luxury-ink-light dark:text-luxury-ink-dark flex items-center gap-2">
              <Building2 className="h-5 w-5 text-luxury-gold" />
              Workshop Identity & Name Change
            </h2>
            <p className="text-xs text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-0.5">
              Change the Owner Profile Name, Business / Garage Name, and official contact phone printed on bills.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/40">
            Live On Bills & SOW
          </span>
        </div>

        <form onSubmit={handleUpdateIdentity} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase font-bold text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-luxury-gold" />
              Owner / Admin Name
            </label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Akshat Mohanty"
              className="w-full px-4 py-2 rounded-xl bg-luxury-canvas-light/70 dark:bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-geek-lime" />
              Workshop / Garage Name
            </label>
            <input
              type="text"
              required
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              placeholder="e.g. MotoFit 2 Workshop"
              className="w-full px-4 py-2 rounded-xl bg-luxury-canvas-light/70 dark:bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-cobalt-ai" />
              Official Phone / WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 7259625881"
              className="w-full px-4 py-2 rounded-xl bg-luxury-canvas-light/70 dark:bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
            />
          </div>

          <div className="md:col-span-3 pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingIdentity}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-geek-lime text-void-black font-bold text-sm shadow-lime-glow hover:bg-geek-lime-hover transition-all"
            >
              <Save className="h-4 w-4" />
              {savingIdentity ? 'Saving Identity...' : 'Save Name & Details'}
            </button>
          </div>
        </form>
      </div>

      {/* MSME GST Strategic Switch Card */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border-2 border-luxury-gold/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-luxury-gold/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                GST Registered Garage (MSME Status)
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  gstEnabled
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
              >
                {gstEnabled ? 'GST Mode (18% Active)' : 'MSME Simplified (0% Tax)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
              Toggle OFF if you are below ₹40L turnover or under the Composition Scheme. Strips away all GST fields across invoices.
            </p>
          </div>
          {/* Neumorphic LED Toggle Switch */}
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
              <span className="text-lg text-luxury-gold">{gstEnabled ? '₹1,180' : '₹1,000'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.name}
              href={category.href}
              className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20 hover:border-luxury-gold/60 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {category.badge && (
                    <span className="px-2 py-0.5 bg-luxury-gold/20 text-luxury-gold text-xs font-semibold rounded-full border border-luxury-gold/40">
                      {category.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-2 group-hover:text-luxury-gold transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 leading-relaxed">
                  {category.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-luxury-gold/10 text-xs font-bold text-geek-lime flex items-center justify-between">
                <span>Configure &rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Settings */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-6 border border-luxury-gold/20">
        <h2 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
          Display & Region Preferences
        </h2>
        <div className="space-y-3">
          <QuickSetting
            label="Dark Mode"
            description="Toggle between light and dark theme (MotoFit high-performance dark theme)"
            type="toggle"
            checked={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <QuickSetting label="Language" description="English / Hindi / Gujarati" type="select" />
          <QuickSetting label="Currency" description="Indian Rupee (₹ INR)" type="select" />
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

function QuickSetting({ label, description, type, checked, onToggle }: QuickSettingProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-luxury-gold/10 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark">{label}</div>
        <div className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">{description}</div>
      </div>
      {type === 'toggle' ? (
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-luxury-gold' : 'bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30'
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
