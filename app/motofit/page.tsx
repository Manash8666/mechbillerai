'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Wrench,
  ShieldCheck,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Crown,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MotoFitPage() {
  const router = useRouter();

  // Customer Vehicle Lookup State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Quick Staff Terminal State
  const [staffRole, setStaffRole] = useState<'owner' | 'manager' | 'mechanic'>('owner');
  const [staffEmail, setStaffEmail] = useState('akshat@motoban.in');
  const [staffPin, setStaffPin] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const contacts = [
    {
      name: 'Akshat Mohanty',
      role: 'Owner & Managing Director',
      phone: '7259625881',
      timing: '10:00 AM – 7:00 PM',
      badge: 'Workshop Owner',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      name: 'Samael Morningstar',
      role: 'Operations & Technical Director',
      phone: '6359635416',
      timing: '10:00 AM – 2:00 AM',
      badge: 'Super Admin',
      badgeColor: 'bg-geek-lime/20 text-geek-lime border-geek-lime/40',
    },
    {
      name: 'Munna',
      role: 'Senior Master Mechanic',
      phone: '9123293450',
      timing: '10:00 AM – 7:00 PM',
      badge: 'Head of Diagnostics',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      name: 'Emergency Roadside Assistance',
      role: '24/7 Breakdown & Towing Desk',
      phone: '+91-6359635416',
      timing: '10:00 AM – 2:00 AM',
      badge: 'Emergency SOS',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
  ];

  const handleSearchVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a vehicle registration number or phone number');
      return;
    }

    try {
      setSearching(true);
      setLookupResult(null);
      const res = await fetch(`/api/invoices?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
      const data = await res.json();
      if (data && data.invoices && data.invoices.length > 0) {
        setLookupResult({
          found: true,
          invoices: data.invoices,
        });
        toast.success(`Found ${data.invoices.length} service record(s)!`);
      } else {
        setLookupResult({
          found: false,
          message: 'No service records found for this vehicle. Please verify registration number or contact our desk.',
        });
      }
    } catch {
      toast.error('Failed to lookup vehicle records.');
    } finally {
      setSearching(false);
    }
  };

  const handleQuickStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staffEmail.trim(),
          password: staffPin.trim(),
          selectedRole: staffRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Authentication failed. Please check credentials.');
        return;
      }

      const user = {
        ...data.user,
        activeRole: staffRole || data.user.role || 'owner',
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
      if (data.token) {
        localStorage.setItem('motoban_token', data.token);
      }

      toast.success(`Welcome to MotoFit 2 Terminal, ${user.name}!`);
      router.push('/dashboard');
    } catch {
      toast.error('Could not authenticate staff session.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-geek-lime selection:text-void-black">
      {/* Top Navbar */}
      <header className="border-b border-[#1C263D] bg-[#151D2F]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-geek-lime/15 border border-geek-lime/40 flex items-center justify-center text-geek-lime shadow-lime-glow">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                MotoFit 2
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  VIP Workshop
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Precision Superbike & Motorcycle Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#0B0F19] border border-[#1C263D] hover:border-geek-lime transition-all"
            >
              Sign In
            </Link>
            <a
              href="https://wa.me/916359635416?text=Hi%20MotoFit%202,%20I%20need%20assistance%20with%20my%20bike%20service."
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-geek-lime text-void-black hover:bg-geek-lime/90 transition-all shadow-lime-glow"
            >
              <Phone className="h-3.5 w-3.5" />
              WhatsApp Desk
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full space-y-12">
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-geek-lime/10 border border-geek-lime/30 text-geek-lime text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Official MotoFit 2 Workshop Portal
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Precision Two-Wheeler & <span className="text-geek-lime">Superbike Center</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Welcome to the dedicated portal for <strong className="text-white">MotoFit 2</strong>. 
            Track real-time digital job cards, verify SoW bills & estimates, or access the authorized workshop operational terminal.
          </p>
        </section>

        {/* Two Column Grid: Customer Lookup & Staff Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Track Vehicle SOW & Bills */}
          <div className="bg-[#151D2F] rounded-2xl p-6 sm:p-8 border border-[#1C263D] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-geek-lime/15 border border-geek-lime/30 flex items-center justify-center text-geek-lime">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Track Your Motorcycle SOW Bill</h2>
                  <p className="text-xs text-slate-400">Enter registration plate or registered mobile number</p>
                </div>
              </div>

              <form onSubmit={handleSearchVehicle} className="space-y-3 mt-5">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="e.g. MH12AB1234 or 9876543210"
                    className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1C263D] text-white text-sm uppercase tracking-wider font-mono focus:outline-none focus:border-geek-lime placeholder:normal-case placeholder:font-sans"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="absolute right-2 top-2 px-4 py-1.5 rounded-lg bg-geek-lime text-void-black text-xs font-bold hover:bg-geek-lime/90 transition-all flex items-center gap-1.5"
                  >
                    {searching ? 'Searching...' : 'Track'}
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {lookupResult && (
                <div className="mt-5 space-y-3">
                  {lookupResult.found ? (
                    lookupResult.invoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl bg-[#0B0F19] border border-geek-lime/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-geek-lime">{inv.invoiceNumber}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Customer: {inv.customer?.name} · Total: ₹{(inv.total || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <a
                          href={`/api/pdf/invoice?id=${inv.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#151D2F] border border-[#1C263D] hover:border-geek-lime text-xs text-slate-200 flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" /> PDF
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-void-black/80 border border-deep-glass text-xs text-slate-400">
                      {lookupResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#1C263D] text-[11px] text-slate-400 flex items-center justify-between">
              <span>All records cryptographically signed</span>
              <span className="text-geek-lime font-mono">100% Paperless</span>
            </div>
          </div>

          {/* Card 2: MotoFit 2 Workshop Floor Terminal */}
          <div className="bg-[#151D2F] rounded-2xl p-6 sm:p-8 border-2 border-geek-lime/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-geek-lime/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-geek-lime/20 border border-geek-lime/50 flex items-center justify-center text-geek-lime">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Authorized Staff Terminal</h2>
                  <p className="text-xs text-slate-400">MotoFit 2 Mechanics, Managers & Owners</p>
                </div>
              </div>

              {/* Role Picker */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStaffRole('owner');
                    setStaffEmail('akshat@motoban.in');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    staffRole === 'owner'
                      ? 'bg-geek-lime text-void-black border-geek-lime shadow-lime-glow'
                      : 'bg-[#0B0F19] text-slate-400 border-[#1C263D]'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStaffRole('manager');
                    setStaffEmail('manager@motoban.in');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    staffRole === 'manager'
                      ? 'bg-geek-lime text-void-black border-geek-lime shadow-lime-glow'
                      : 'bg-[#0B0F19] text-slate-400 border-[#1C263D]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStaffRole('mechanic');
                    setStaffEmail('munna@motoban.in');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                    staffRole === 'mechanic'
                      ? 'bg-geek-lime text-void-black border-geek-lime shadow-lime-glow'
                      : 'bg-[#0B0F19] text-slate-400 border-[#1C263D]'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Mechanic</span>
                </button>
              </div>

              <form onSubmit={handleQuickStaffLogin} className="space-y-3 mt-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Staff Identity Email
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1C263D] text-white text-xs focus:outline-none focus:border-geek-lime"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Password / 4-Digit Access PIN
                  </label>
                  <input
                    type="password"
                    required
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1C263D] text-white text-xs focus:outline-none focus:border-geek-lime"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-3 rounded-xl bg-geek-lime text-void-black font-extrabold text-xs shadow-lime-glow hover:bg-geek-lime/90 transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {loggingIn ? 'Authenticating Terminal...' : `Launch MotoFit 2 as ${staffRole.toUpperCase()}`}
                </button>
              </form>
            </div>

            <div className="mt-5 pt-4 border-t border-[#1C263D] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync Active
              </span>
              <span className="text-amber-400 font-mono">MOTOBAN-VIP-FOUNDER-01</span>
            </div>
          </div>
        </div>

        {/* Official Workshop Contacts Directory */}
        <section className="bg-[#151D2F] rounded-2xl p-6 sm:p-8 border border-[#1C263D] shadow-xl">
          <div className="max-w-2xl mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="h-6 w-6 text-geek-lime" />
              Official Workshop Contacts & Key Personnel
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Connect directly with our master technicians, workshop management, or emergency breakdown desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contacts.map((contact, idx) => (
              <div
                key={contact.name}
                className="p-5 rounded-xl bg-[#0B0F19] border border-[#1C263D] hover:border-geek-lime/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500">0{idx + 1}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${contact.badgeColor}`}>
                      {contact.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{contact.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{contact.role}</p>

                  <div className="mt-4 pt-4 border-t border-[#1C263D] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-geek-lime font-bold">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <a href={`tel:${contact.phone}`} className="hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span>{contact.timing}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1C263D]/60 flex items-center justify-between">
                  <a
                    href={`https://wa.me/91${contact.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(contact.name)},%20I%20am%20contacting%20you%20regarding%20MotoFit%202.`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-slate-300 hover:text-geek-lime flex items-center gap-1 transition-colors"
                  >
                    WhatsApp &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1C263D] bg-[#0B0F19] py-8 text-center text-xs text-slate-500">
        <p>MotoFit 2 Precision Superbike & Motorcycle Center · Powered by MotoBan Cloud Engine</p>
        <p className="mt-1">Official VIP Founding Garage · Hybrid StudioZ</p>
      </footer>
    </div>
  );
}
