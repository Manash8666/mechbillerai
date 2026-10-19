'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Key, Smartphone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
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
          password: newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Failed to update password');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating password');
    } finally {
      setLoading(false);
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
            <Shield className="h-7 w-7 text-emerald-400" />
            Security & Authentication
          </h1>
          <p className="text-xs sm:text-sm text-steel-dim mt-0.5">
            Manage your workshop password, HMAC tokens, and credential security.
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
        <h3 className="text-lg font-bold text-pure-white flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-geek-lime" />
          Update Workshop Password
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
              New Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-geek-lime text-void-black font-bold text-sm shadow-lime-glow hover:bg-geek-lime-hover transition-all"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Security Features Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/20 flex items-start gap-3">
          <Key className="h-6 w-6 text-royal-gold shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-pure-white">HMAC Anti-Tamper Bill Tokens</h4>
            <p className="text-xs text-steel-dim mt-1">
              Every SOW Bill and invoice generated by MotoBan is signed with SHA-256 HMAC cryptographic tokens to prevent bill tampering.
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Enabled on all Bills
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/20 flex items-start gap-3">
          <Smartphone className="h-6 w-6 text-cobalt-ai shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-pure-white">Mobile Floor PIN Protection</h4>
            <p className="text-xs text-steel-dim mt-1">
              Technicians and floor mechanics use fast 4-digit PIN authentication on Android & iOS to prevent unauthorized financial access.
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Configured in Team Settings
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
