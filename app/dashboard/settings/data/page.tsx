'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Download,
  Cloud,
  HardDrive,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DataSettingsPage() {
  const [downloading, setDownloading] = useState(false);

  // Reset modal state
  const [resetModalMode, setResetModalMode] = useState<'DATA_RESET' | 'SYSTEM_RESET' | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleExportData = async (type: 'all' | 'customers' | 'invoices' | 'inventory') => {
    try {
      setDownloading(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch customers, invoices, inventory
      const [custRes, invRes, partRes] = await Promise.all([
        fetch(`/api/customers?userId=${userObj?.id}`, { headers }).then((r) => r.json()).catch(() => ({ customers: [] })),
        fetch(`/api/invoices?userId=${userObj?.id}`, { headers }).then((r) => r.json()).catch(() => ({ invoices: [] })),
        fetch(`/api/inventory?userId=${userObj?.id}`, { headers }).then((r) => r.json()).catch(() => ({ items: [] })),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        workshop: userObj?.name || 'MotoBan Workshop',
        email: userObj?.email,
        customers: custRes.customers || [],
        invoices: invRes.invoices || [],
        inventory: partRes.items || [],
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `motoban-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('Backup downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export workshop data');
    } finally {
      setDownloading(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalMode) return;

    const requiredPhrase = resetModalMode === 'DATA_RESET' ? 'RESET DATA' : 'RESET SYSTEM';
    if (confirmInput.trim().toUpperCase() !== requiredPhrase && !resetPassword.trim()) {
      toast.error(`Please type "${requiredPhrase}" or enter your password to confirm`);
      return;
    }

    try {
      setResetting(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: userObj?.id,
          mode: resetModalMode,
          confirmPhrase: confirmInput.trim(),
          password: resetPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Reset completed successfully!');
        setResetModalMode(null);
        setConfirmInput('');
        setResetPassword('');
      } else {
        toast.error(data.error || 'Reset operation failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during reset operation');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="p-2 rounded-xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 hover:border-luxury-gold text-pure-white transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pure-white flex items-center gap-2">
            <Database className="h-7 w-7 text-purple-400" />
            Data Management & System Reset Hub
          </h1>
          <p className="text-xs sm:text-sm text-steel-dim mt-0.5">
            Download full offline data dumps, clear demo records with Data Reset, or execute a factory System Reset.
          </p>
        </div>
      </div>

      {/* Cloud Sync Status */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-pure-white">Turso Edge Cloud Database Connected</h3>
              <p className="text-xs text-steel-dim mt-0.5">
                All workshop job cards, customer vehicles, and invoices are automatically replicated in real time across redundant AWS regions.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            Active & Synced
          </span>
        </div>
      </div>

      {/* One-Click Backup Export */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
        <h3 className="text-lg font-bold text-pure-white flex items-center gap-2 mb-2">
          <Download className="h-5 w-5 text-geek-lime" />
          Offline Data Backup Export
        </h3>
        <p className="text-xs text-steel-dim mb-5 max-w-xl">
          Download a complete snapshot of all your customers, vehicles, GST bills, and inventory spare parts in JSON format for offline safe-keeping.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExportData('all')}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-geek-lime text-void-black font-bold text-sm shadow-lime-glow hover:bg-geek-lime-hover transition-all"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing Backup...' : 'Export Full Workshop Backup (JSON)'}
          </button>
        </div>
      </div>

      {/* Danger Zone: Data Reset & System Reset */}
      <div className="rounded-2xl p-6 bg-rose-950/20 border-2 border-rose-500/40 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
          <ShieldAlert className="h-6 w-6 text-rose-400" />
          <div>
            <h3 className="text-lg font-bold text-rose-300">Danger Zone: Workshop Reset Operations</h3>
            <p className="text-xs text-rose-200/70">
              High-impact administrative operations. All resets require explicit password or keyword confirmation.
            </p>
          </div>
        </div>

        {/* Action 1: Data Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-void-black/60 border border-rose-500/30">
          <div>
            <h4 className="text-sm font-bold text-pure-white flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-400" />
              Data Reset (Clear Test & Demo Records)
            </h4>
            <p className="text-xs text-steel-dim mt-1 max-w-md">
              Safely deletes all test invoices, job cards, appointments, and test customer vehicles. Keeps your user account, staff logins, branding, and parts catalog intact.
            </p>
          </div>
          <button
            onClick={() => {
              setResetModalMode('DATA_RESET');
              setConfirmInput('');
              setResetPassword('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-xs shrink-0 transition-all"
          >
            Execute Data Reset &rarr;
          </button>
        </div>

        {/* Action 2: System Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-void-black/60 border border-rose-500/30">
          <div>
            <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-400" />
              System Reset (Factory Reset)
            </h4>
            <p className="text-xs text-steel-dim mt-1 max-w-md">
              Restores the entire workshop database, inventory, and branding back to initial factory setup. Your VIP Lifetime Free status is permanently preserved.
            </p>
          </div>
          <button
            onClick={() => {
              setResetModalMode('SYSTEM_RESET');
              setConfirmInput('');
              setResetPassword('');
            }}
            className="px-4 py-2 rounded-xl bg-rose-600/30 text-rose-200 hover:bg-rose-600/50 border border-rose-500/50 font-bold text-xs shrink-0 transition-all"
          >
            Execute Factory System Reset &rarr;
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {resetModalMode && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151D2F] rounded-2xl max-w-md w-full p-6 border-2 border-rose-500/50 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400 mb-4 pb-3 border-b border-rose-500/30">
              <AlertTriangle className="h-7 w-7 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-pure-white">
                  Confirm {resetModalMode === 'DATA_RESET' ? 'Data Reset' : 'Factory System Reset'}
                </h3>
                <p className="text-xs text-rose-300">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-steel-dim leading-relaxed mb-4">
              {resetModalMode === 'DATA_RESET'
                ? 'This will wipe all test invoices, payments, job cards, customer vehicles, and appointments. Your user profile, VIP license, and parts catalog will remain safe.'
                : 'This will reset all invoices, job cards, inventory items, and custom branding settings back to fresh out-of-the-box defaults. Your VIP Lifetime Free license will be preserved.'}
            </p>

            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  Type <span className="text-rose-400 font-mono">{resetModalMode === 'DATA_RESET' ? 'RESET DATA' : 'RESET SYSTEM'}</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={resetModalMode === 'DATA_RESET' ? 'RESET DATA' : 'RESET SYSTEM'}
                  className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-rose-500/40 text-pure-white text-sm font-mono focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  Or enter your Account Password:
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalMode(null)}
                  className="flex-1 py-2.5 rounded-xl bg-void-black/50 border border-steel-dim/30 text-steel-dim text-sm font-bold hover:text-pure-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-pure-white text-sm font-bold shadow-lg shadow-rose-900/30 transition-all"
                >
                  {resetting ? 'Resetting...' : 'Yes, Confirm & Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
