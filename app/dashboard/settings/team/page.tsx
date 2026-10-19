'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Shield,
  Phone,
  KeyRound,
  Trash2,
  CheckCircle2,
  Wrench,
  UserCheck,
  RefreshCw,
  Sparkles,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'super_admin' | 'manager' | 'senior_mechanic' | 'technician' | 'auditor';
  pin: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, { label: string; badge: string; icon: any }> = {
  owner: {
    label: 'Workshop Owner',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Shield,
  },
  super_admin: {
    label: 'Super Admin (Full Privileges)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: Shield,
  },
  manager: {
    label: 'Service Manager',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: UserCheck,
  },
  senior_mechanic: {
    label: 'Senior Mechanic',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Wrench,
  },
  technician: {
    label: 'Technician',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: Wrench,
  },
  auditor: {
    label: 'Auditor / Accountant',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    icon: Shield,
  },
};

export default function TeamSettingsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Add Member
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'senior_mechanic' | 'technician' | 'auditor'>('senior_mechanic');
  const [pin, setPin] = useState('1234');

  // State for PIN Reset Modal
  const [pinResetMember, setPinResetMember] = useState<TeamMember | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinUpdating, setPinUpdating] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = userObj?.id ? `/api/team?userId=${userObj.id}` : '/api/team';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Please enter both name and phone number');
      return;
    }

    try {
      setSubmitting(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = userObj?.id ? `/api/team?userId=${userObj.id}` : '/api/team';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, phone, role, pin }),
      });

      if (res.ok) {
        toast.success(`Staff member "${name}" saved!`);
        setName('');
        setPhone('');
        setPin('1234');
        setShowAddModal(false);
        void fetchTeam();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save staff member');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving staff');
    } finally {
      setSubmitting(false);
    }
  };

  const openPinResetModal = (member: TeamMember) => {
    setPinResetMember(member);
    setNewPin(member.pin || '1234');
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinResetMember) return;

    if (!/^\d{4,6}$/.test(newPin.trim())) {
      toast.error('PIN must be 4 to 6 digits (e.g. 1234)');
      return;
    }

    try {
      setPinUpdating(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = userObj?.id ? `/api/team?userId=${userObj.id}` : '/api/team';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          memberId: pinResetMember.id,
          newPin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`PIN for ${pinResetMember.name} successfully reset to ${newPin.trim()}!`);
        setTeam((prev) =>
          prev.map((m) => (m.id === pinResetMember.id ? { ...m, pin: newPin.trim() } : m))
        );
        setPinResetMember(null);
      } else {
        toast.error(data.error || 'Failed to reset PIN');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error resetting PIN');
    } finally {
      setPinUpdating(false);
    }
  };

  const generateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPin(randomPin);
    toast.success(`Generated PIN: ${randomPin}`);
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove "${memberName}" from workshop staff?`)) return;

    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = userObj?.id ? `/api/team?userId=${userObj.id}&id=${id}` : `/api/team?id=${id}`;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { method: 'DELETE', headers });
      if (res.ok) {
        toast.success(`Removed ${memberName}`);
        setTeam((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error('Failed to remove staff member');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting staff member');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="p-2 rounded-xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 hover:border-luxury-gold text-pure-white transition-all"
            title="Back to Settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-pure-white flex items-center gap-2">
              <Users className="h-7 w-7 text-geek-lime" />
              Workshop Staff & PIN Management
            </h1>
            <p className="text-xs sm:text-sm text-steel-dim mt-0.5">
              Reset 4-digit floor mechanic PINs, manage roles, and grant Mobile App access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchTeam()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 hover:border-luxury-gold text-steel-dim hover:text-pure-white transition-all"
            title="Refresh List"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-geek-lime text-void-black font-bold text-sm shadow-lime-glow hover:bg-geek-lime-hover transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-12 text-center text-steel-dim">Loading workshop team...</div>
      ) : team.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/20">
          <Users className="h-12 w-12 text-steel-dim mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold text-pure-white">No Staff Members Added Yet</h3>
          <p className="text-xs text-steel-dim mt-1 max-w-sm mx-auto">
            Click &quot;Add Staff Member&quot; to register your mechanics and floor managers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((member) => {
            const roleMeta = ROLE_LABELS[member.role] || ROLE_LABELS.senior_mechanic;
            const Icon = roleMeta.icon;

            return (
              <div
                key={member.id}
                className="rounded-2xl p-5 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 hover:border-luxury-gold/50 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-void-black/60 border border-luxury-gold/30 flex items-center justify-center text-pure-white font-black text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-pure-white leading-tight">{member.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-steel-dim mt-0.5">
                          <Phone className="h-3 w-3 text-steel-dim" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="text-steel-dim hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Remove Staff"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-luxury-gold/15 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.badge}`}
                    >
                      <Icon className="h-3 w-3" />
                      {roleMeta.label}
                    </span>

                    {/* PIN Display & Reset Action */}
                    <button
                      onClick={() => openPinResetModal(member)}
                      className="group flex items-center gap-1.5 text-xs text-amber-300 hover:text-white bg-black/60 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-400 font-mono transition-all"
                      title="Click to Reset PIN"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                      <span>PIN: {member.pin || '1234'}</span>
                      <span className="text-[10px] text-amber-400/70 ml-1 underline group-hover:text-amber-300">
                        Reset
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-luxury-gold/10 flex items-center justify-between text-[11px] text-steel-dim">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Mobile App Login Enabled
                  </span>
                  <button
                    onClick={() => openPinResetModal(member)}
                    className="text-geek-lime hover:underline font-semibold"
                  >
                    Reset PIN &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PIN Reset Modal */}
      {pinResetMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151D2F] rounded-2xl max-w-md w-full p-6 border-2 border-luxury-gold/40 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-luxury-gold/20">
              <div className="flex items-center gap-2">
                <KeyRound className="h-6 w-6 text-amber-400" />
                <div>
                  <h3 className="text-lg font-bold text-pure-white">Reset 4-Digit Quick PIN</h3>
                  <p className="text-xs text-steel-dim">{pinResetMember.name} ({ROLE_LABELS[pinResetMember.role]?.label || pinResetMember.role})</p>
                </div>
              </div>
              <button
                onClick={() => setPinResetMember(null)}
                className="text-steel-dim hover:text-pure-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  New 4-Digit Quick PIN (e.g. 1234 or 9821)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-lg font-mono text-center tracking-widest focus:outline-none focus:border-geek-lime"
                    placeholder="1234"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="px-3 py-2.5 rounded-xl bg-void-black border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5"
                    title="Generate Random 4-digit PIN"
                  >
                    <Sparkles className="h-4 w-4" />
                    Random PIN
                  </button>
                </div>
                <p className="text-[11px] text-steel-dim mt-2">
                  The mechanic will use this PIN along with their mobile phone number ({pinResetMember.phone}) to login to the mobile floor app.
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPinResetMember(null)}
                  className="flex-1 py-2.5 rounded-xl bg-void-black/50 border border-steel-dim/30 text-steel-dim text-sm font-bold hover:text-pure-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-geek-lime text-void-black text-sm font-bold shadow-lime-glow hover:bg-geek-lime-hover transition-all"
                >
                  {pinUpdating ? 'Resetting PIN...' : 'Save New PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151D2F] rounded-2xl max-w-md w-full p-6 border-2 border-luxury-gold/40 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-pure-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-geek-lime" />
                Add Workshop Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-steel-dim hover:text-pure-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  Workshop Role
                </label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm focus:outline-none focus:border-geek-lime"
                >
                  <option value="owner">Workshop Owner</option>
                  <option value="super_admin">Super Admin (Full Privileges)</option>
                  <option value="manager">Service Manager / Advisor</option>
                  <option value="senior_mechanic">Senior Mechanic</option>
                  <option value="technician">Technician / Helper</option>
                  <option value="auditor">Auditor / Accountant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-steel-dim mb-1">
                  4-Digit Mobile Quick PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-sm font-mono focus:outline-none focus:border-geek-lime"
                />
                <p className="text-[11px] text-steel-dim mt-1">
                  Mechanics use their phone number + this 4-digit PIN to sign into the MotoBan Mobile App.
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-void-black/50 border border-steel-dim/30 text-steel-dim text-sm font-bold hover:text-pure-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-geek-lime text-void-black text-sm font-bold shadow-lime-glow hover:bg-geek-lime-hover transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
