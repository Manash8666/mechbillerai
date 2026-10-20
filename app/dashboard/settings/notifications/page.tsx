'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, MessageSquare, Smartphone, CheckCircle2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsSettingsPage() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [serviceReminders, setServiceReminders] = useState(true);
  const [readyForPickupAlert, setReadyForPickupAlert] = useState(true);
  const [customFooterNote, setCustomFooterNote] = useState('Thank you for servicing with MotoFit 2 Workshop! Drive safe.');

  const handleSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
    toast.success('Notification preferences saved!');
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
            <Bell className="h-7 w-7 text-blue-400" />
            Customer Notifications & WhatsApp Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-steel-dim mt-0.5">
            Configure automated WhatsApp alerts, invoice sharing, and post-service reminders.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle Cards */}
        <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-pure-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            WhatsApp & SMS Triggers
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-void-black/40 border border-luxury-gold/15">
            <div>
              <h4 className="text-sm font-bold text-pure-white">1-Tap WhatsApp Invoice Sharing</h4>
              <p className="text-xs text-steel-dim mt-0.5">
                Automatically formats a direct WhatsApp bill message with PDF link when an invoice is marked completed.
              </p>
            </div>
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="h-5 w-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-void-black/40 border border-luxury-gold/15">
            <div>
              <h4 className="text-sm font-bold text-pure-white">&quot;Vehicle Ready For Delivery&quot; Alert</h4>
              <p className="text-xs text-steel-dim mt-0.5">
                Sends an instant pickup alert to the bike owner once quality check and test drive are verified.
              </p>
            </div>
            <input
              type="checkbox"
              checked={readyForPickupAlert}
              onChange={(e) => setReadyForPickupAlert(e.target.checked)}
              className="h-5 w-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-void-black/40 border border-luxury-gold/15">
            <div>
              <h4 className="text-sm font-bold text-pure-white">90-Day Periodic Service Reminder</h4>
              <p className="text-xs text-steel-dim mt-0.5">
                Alerts returning bike owners when oil change or periodic maintenance is due.
              </p>
            </div>
            <input
              type="checkbox"
              checked={serviceReminders}
              onChange={(e) => setServiceReminders(e.target.checked)}
              className="h-5 w-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Custom Footer Note */}
        <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
          <label className="block text-sm font-bold text-pure-white mb-2">
            WhatsApp Bill Message Footer Note
          </label>
          <textarea
            rows={3}
            value={customFooterNote}
            onChange={(e) => setCustomFooterNote(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-geek-lime text-void-black font-bold text-sm shadow-lime-glow hover:bg-geek-lime-hover transition-all"
        >
          <Save className="h-4 w-4" />
          Save Notification Settings
        </button>
      </form>
    </div>
  );
}
