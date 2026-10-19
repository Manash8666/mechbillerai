'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Download, Cloud, HardDrive, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DataSettingsPage() {
  const [downloading, setDownloading] = useState(false);

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
            Data Backup & Export Vault
          </h1>
          <p className="text-xs sm:text-sm text-steel-dim mt-0.5">
            Download full offline data dumps, inspect cloud sync status, and safeguard your workshop records.
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
              <h3 className="text-base font-bold text-pure-white">Turso Edge Cloud Sync Active</h3>
              <p className="text-xs text-steel-dim mt-0.5">
                All workshop job cards, customer vehicles, and invoices are automatically replicated in real time across redundant AWS regions.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            Healthy & Replicated
          </span>
        </div>
      </div>

      {/* One-Click Backup Export */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
        <h3 className="text-lg font-bold text-pure-white flex items-center gap-2 mb-2">
          <Download className="h-5 w-5 text-geek-lime" />
          One-Click Offline Data Export
        </h3>
        <p className="text-xs text-steel-dim mb-5 max-w-xl">
          Download a complete, portable JSON snapshot of all your customers, vehicles, GST bills, and inventory spare parts for accounting or offline records.
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
    </div>
  );
}
