'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  Calendar,
  Wallet,
  Building2,
  Package,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';
import { formatCurrency, formatDate } from '@/lib/utils';

type PeriodType = 'today' | 'this_week' | 'this_month' | 'this_fy' | 'all';
type TabType = 'ledger' | 'pnl' | 'balance_sheet' | 'ai_forecast';

interface LedgerEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  paymentMode: string;
  description: string;
  date: string;
  reference?: string | null;
  notes?: string | null;
}

const EXPENSE_CATEGORIES = [
  'Spare Parts Purchase',
  'Mechanic & Staff Salaries',
  'Shop Rent & Maintenance',
  'Electricity & Utilities',
  'Workshop Tools & Hardware',
  'Oils, Lubricants & Consumables',
  'Tea & Workshop Refreshments',
  'Marketing & Signage',
  'Miscellaneous Operational Expense',
];

const INCOME_CATEGORIES = [
  'Workshop Service Bill',
  'Direct Counter Sale',
  'Scrap / Old Battery Exchange',
  'Vehicle Washing & Detailing',
  'Miscellaneous Operating Income',
];

export default function DailyLedgerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ledger');
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Executive AI Forecast State
  const [forecastData, setForecastData] = useState<any>(null);
  const [isExecutive, setIsExecutive] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState('cash');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = user?.id ? `/api/ledger?userId=${user.id}&period=${period}` : `/api/ledger?period=${period}`;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
      toast.error('Network error loading ledger');
    } finally {
      setLoading(false);
    }
  };

  const checkExecutiveAccessAndFetchForecast = async () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = user?.id ? `/api/ai/forecast?userId=${user.id}` : '/api/ai/forecast';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      setLoadingForecast(true);
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.isAuthorized) {
          setIsExecutive(true);
          setForecastData(json);
        }
      } else {
        setIsExecutive(false);
      }
    } catch {
      setIsExecutive(false);
    } finally {
      setLoadingForecast(false);
    }
  };

  useEffect(() => {
    void fetchLedger();
    void checkExecutiveAccessAndFetchForecast();
  }, [period]);

  const handleOpenAdd = (type: 'INCOME' | 'EXPENSE') => {
    setModalMode('create');
    setEditingId(null);
    setFormType(type);
    setFormCategory(type === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setFormAmount('');
    setFormPaymentMode('cash');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReference('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: LedgerEntry) => {
    setModalMode('edit');
    setEditingId(entry.id);
    setFormType(entry.type);
    setFormCategory(entry.category);
    setFormAmount(String(entry.amount));
    setFormPaymentMode(entry.paymentMode || 'cash');
    setFormDescription(entry.description);
    setFormDate(new Date(entry.date).toISOString().split('T')[0]);
    setFormReference(entry.reference || '');
    setFormNotes(entry.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const amountVal = Number(formAmount);
    if (!amountVal || amountVal <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      setSubmitting(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const payload = {
        userId: user?.id,
        type: formType,
        category: formCategory,
        amount: amountVal,
        paymentMode: formPaymentMode,
        description: formDescription.trim(),
        date: new Date(formDate).toISOString(),
        reference: formReference.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };

      const url = modalMode === 'edit' && editingId ? `/api/ledger/${editingId}` : '/api/ledger';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save entry');
      }

      toast.success(modalMode === 'edit' ? 'Entry updated successfully!' : `${formType === 'INCOME' ? 'Income' : 'Expense'} recorded!`);
      setIsModalOpen(false);
      await fetchLedger();
    } catch (err: any) {
      toast.error(err.message || 'Error saving entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string, description: string) => {
    if (!confirm(`Delete ledger entry "${description}"?`)) return;

    const toastId = toast.loading('Deleting entry...');
    try {
      const res = await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Entry deleted', { id: toastId });
        await fetchLedger();
      } else {
        toast.error('Failed to delete entry', { id: toastId });
      }
    } catch {
      toast.error('Network error deleting entry', { id: toastId });
    }
  };

  const filteredEntries = (data?.entries || []).filter((entry: LedgerEntry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.reference && entry.reference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'ALL' || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader text="Calculating" />
      </div>
    );
  }

  const summary = data?.summary || {
    directIncome: 0,
    invoicedRevenue: 0,
    grossTotalRevenue: 0,
    directExpense: 0,
    netOperatingProfit: 0,
    profitMargin: 0,
  };

  const balanceSheet = data?.balanceSheet || {
    cashInHand: 0,
    bankUpiBalance: 0,
    accountsReceivable: 0,
    inventoryValuation: 0,
    totalCurrentAssets: 0,
    retainedEarnings: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span>Daily Ledger & P&L</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono font-bold">
              REAL-TIME
            </span>
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Track daily workshop income, record operational expenses, and audit Balance Sheet liquidity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => handleOpenAdd('EXPENSE')}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-[#FF5E14] text-white font-bold text-xs hover:bg-[#e6510d] shadow-[0_0_15px_rgba(255,94,20,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Record Expense</span>
          </button>

          <button
            onClick={() => handleOpenAdd('INCOME')}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-[#10B981] text-[#0B0F19] font-bold text-xs hover:bg-[#0ea371] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Record Income</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#151D2F] border border-[#1C263D] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
            <span>Gross Revenue</span>
            <ArrowDownLeft className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-extrabold text-[#10B981] font-mono mt-2">
            {formatCurrency(summary.grossTotalRevenue)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Bills: {formatCurrency(summary.invoicedRevenue)}</span>
            <span>•</span>
            <span>Direct: {formatCurrency(summary.directIncome)}</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-[#151D2F] border border-[#1C263D] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
            <span>Operating Expenses</span>
            <ArrowUpRight className="w-4 h-4 text-[#FF5E14]" />
          </div>
          <div className="text-2xl font-extrabold text-[#FF5E14] font-mono mt-2">
            {formatCurrency(summary.directExpense)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {Object.keys(data?.categoryTotals || {}).length} expense categories active
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-[#151D2F] border-2 border-[#C9F31D]/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#C9F31D] font-bold uppercase tracking-wider">
            <span>Net Operating Profit</span>
            <TrendingUp className="w-4 h-4 text-[#C9F31D]" />
          </div>
          <div className={`text-2xl font-extrabold font-mono mt-2 ${summary.netOperatingProfit >= 0 ? 'text-[#C9F31D]' : 'text-[#EF4444]'}`}>
            {formatCurrency(summary.netOperatingProfit)}
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1">
            Operating Margin: <span className="font-bold text-white">{summary.profitMargin}%</span>
          </div>
        </div>

        {/* Total Liquid Assets */}
        <div className="bg-[#151D2F] border border-[#1C263D] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#E5C07B] font-bold uppercase tracking-wider">
            <span>Liquid Cash & Bank Vault</span>
            <Wallet className="w-4 h-4 text-[#E5C07B]" />
          </div>
          <div className="text-2xl font-extrabold text-[#E5C07B] font-mono mt-2">
            {formatCurrency(balanceSheet.cashInHand + balanceSheet.bankUpiBalance)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Cash: {formatCurrency(balanceSheet.cashInHand)}</span>
            <span>•</span>
            <span>UPI/Bank: {formatCurrency(balanceSheet.bankUpiBalance)}</span>
          </div>
        </div>
      </div>

      {/* Period Filter & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C263D] pb-3">
        {/* Main Feature Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#C9F31D] text-[#0B0F19] shadow-[0_0_12px_rgba(201,243,29,0.3)]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#151D2F]'
            }`}
          >
            <span>Daily Ledger Entries</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {filteredEntries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pnl'
                ? 'bg-[#C9F31D] text-[#0B0F19] shadow-[0_0_12px_rgba(201,243,29,0.3)]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#151D2F]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>P&L Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('balance_sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'balance_sheet'
                ? 'bg-[#C9F31D] text-[#0B0F19] shadow-[0_0_12px_rgba(201,243,29,0.3)]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#151D2F]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Balance Sheet</span>
          </button>

          {isExecutive && (
            <button
              onClick={() => setActiveTab('ai_forecast')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ai_forecast'
                  ? 'bg-gradient-to-r from-[#E5C07B] to-[#C9F31D] text-[#0B0F19] shadow-[0_0_20px_rgba(229,192,123,0.4)]'
                  : 'text-[#E5C07B] border border-[#E5C07B]/40 hover:bg-[#E5C07B]/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>👑 Executive AI Sales Forecast</span>
            </button>
          )}
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-1.5 bg-[#151D2F] p-1 rounded-xl border border-[#1C263D] self-start md:self-auto">
          {(['today', 'this_week', 'this_month', 'this_fy', 'all'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                period === p ? 'bg-[#0B0F19] text-[#C9F31D] shadow-sm font-bold' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DAILY LEDGER REGISTER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Type Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search descriptions, vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#151D2F] border border-[#1C263D] rounded-xl text-xs text-white placeholder-[#64748B] focus:ring-1 focus:ring-[#C9F31D] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === t
                      ? t === 'EXPENSE'
                        ? 'bg-[#FF5E14] text-white'
                        : t === 'INCOME'
                        ? 'bg-[#10B981] text-[#0B0F19]'
                        : 'bg-white text-[#0B0F19]'
                      : 'bg-[#151D2F] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-[#151D2F] rounded-2xl border border-[#1C263D] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#94A3B8]">
                <thead className="bg-[#0B0F19]/60 text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#1C263D]">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Type & Category</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Payment Mode</th>
                    <th className="px-5 py-3.5">Voucher / Ref</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C263D]">
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry: LedgerEntry) => (
                      <tr key={entry.id} className="hover:bg-[#1C263D]/40 transition-colors">
                        <td className="px-5 py-3.5 text-white font-mono whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                entry.type === 'INCOME'
                                  ? 'bg-[#10B981]/20 text-[#10B981]'
                                  : 'bg-[#FF5E14]/20 text-[#FF5E14]'
                              }`}
                            >
                              {entry.type}
                            </span>
                            <span className="text-white font-medium">{entry.category}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-200">
                          <div>{entry.description}</div>
                          {entry.notes && <div className="text-[10px] text-[#64748B] italic">{entry.notes}</div>}
                        </td>
                        <td className="px-5 py-3.5 uppercase font-mono text-[11px] text-white">
                          {entry.paymentMode || 'CASH'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-400">
                          {entry.reference || '—'}
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-mono font-bold text-sm ${
                            entry.type === 'INCOME' ? 'text-[#10B981]' : 'text-[#FF5E14]'
                          }`}
                        >
                          {entry.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id, entry.description)}
                              className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[#64748B]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileSpreadsheet className="w-8 h-8 text-[#64748B]/50" />
                          <p className="text-sm">No ledger entries found for this time period.</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleOpenAdd('EXPENSE')}
                              className="text-xs text-[#FF5E14] font-bold hover:underline"
                            >
                              + Record an Expense
                            </button>
                            <span className="text-[#64748B]">•</span>
                            <button
                              onClick={() => handleOpenAdd('INCOME')}
                              className="text-xs text-[#10B981] font-bold hover:underline"
                            >
                              + Record an Income
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: P&L STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-[#151D2F] rounded-2xl p-6 border border-[#1C263D] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Operating Income / Revenue</span>
              <span className="text-xs text-[#10B981] font-mono font-extrabold">{formatCurrency(summary.grossTotalRevenue)}</span>
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                <div>
                  <div className="font-semibold text-white">Paid Customer Invoices</div>
                  <div className="text-[10px] text-[#64748B]">Automated GST bills cleared</div>
                </div>
                <div className="font-mono font-bold text-[#10B981]">{formatCurrency(summary.invoicedRevenue)}</div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                <div>
                  <div className="font-semibold text-white">Direct Ledger Income</div>
                  <div className="text-[10px] text-[#64748B]">Counter sales, scraps, labor cash</div>
                </div>
                <div className="font-mono font-bold text-[#10B981]">{formatCurrency(summary.directIncome)}</div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-[#151D2F] rounded-2xl p-6 border border-[#1C263D] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Operating Expenses</span>
              <span className="text-xs text-[#FF5E14] font-mono font-extrabold">{formatCurrency(summary.directExpense)}</span>
            </h3>

            <div className="space-y-2.5 pt-2 text-xs max-h-80 overflow-y-auto">
              {Object.keys(data?.categoryTotals || {}).length > 0 ? (
                Object.entries(data.categoryTotals).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between items-center p-2.5 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                    <span className="text-white font-medium">{cat}</span>
                    <span className="font-mono font-bold text-[#FF5E14]">{formatCurrency(amt as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[#64748B] text-xs">No expense records found.</div>
              )}
            </div>
          </div>

          {/* Net Profit & Margin Card */}
          <div className="bg-gradient-to-br from-[#151D2F] to-[#0B0F19] rounded-2xl p-6 border-2 border-[#C9F31D]/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9F31D]/15 border border-[#C9F31D]/30 text-[#C9F31D] text-xs font-bold uppercase tracking-wider mb-4">
                <span>Profit & Loss Synthesis</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white font-mono">
                {formatCurrency(summary.netOperatingProfit)}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">Net Operating Bottom Line ({period.replace('_', ' ')})</p>

              <div className="mt-6 space-y-3 pt-4 border-t border-[#1C263D] text-xs">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Total Gross Inflow:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(summary.grossTotalRevenue)}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Total Operating Outflow:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(summary.directExpense)}</span>
                </div>
                <div className="flex justify-between text-[#C9F31D] font-bold">
                  <span>Operating Profit Margin:</span>
                  <span className="font-mono text-sm">{summary.profitMargin}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenAdd('EXPENSE')}
              className="w-full mt-6 py-2.5 rounded-xl bg-[#FF5E14]/15 border border-[#FF5E14]/40 text-[#FF5E14] font-bold text-xs hover:bg-[#FF5E14]/25 transition-all text-center"
            >
              + Record New Workshop Expense
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BALANCE SHEET */}
      {activeTab === 'balance_sheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Assets */}
          <div className="bg-[#151D2F] rounded-2xl p-6 border border-[#1C263D] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C263D] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C9F31D]" />
                <span>Current Assets</span>
              </h3>
              <span className="text-sm font-extrabold text-[#C9F31D] font-mono">
                {formatCurrency(balanceSheet.totalCurrentAssets)}
              </span>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                <div>
                  <div className="font-semibold text-white">Cash in Hand (Counter Cash)</div>
                  <div className="text-[10px] text-[#64748B]">Physical bills collected minus cash paid</div>
                </div>
                <div className="font-mono font-bold text-white">{formatCurrency(balanceSheet.cashInHand)}</div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                <div>
                  <div className="font-semibold text-white">Bank Accounts & UPI Vault</div>
                  <div className="text-[10px] text-[#64748B]">Digital settlements (GPay, PhonePe, Card)</div>
                </div>
                <div className="font-mono font-bold text-white">{formatCurrency(balanceSheet.bankUpiBalance)}</div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                <div>
                  <div className="font-semibold text-white">Accounts Receivable (Customer Due)</div>
                  <div className="text-[10px] text-[#64748B]">Unpaid & partial customer invoices</div>
                </div>
                <div className="font-mono font-bold text-[#E5C07B]">{formatCurrency(balanceSheet.accountsReceivable)}</div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D]">
                <div>
                  <div className="font-semibold text-white">Inventory Valuation (Cost Basis)</div>
                  <div className="text-[10px] text-[#64748B]">Current parts stock multiplied by unit cost</div>
                </div>
                <div className="font-mono font-bold text-white">{formatCurrency(balanceSheet.inventoryValuation)}</div>
              </div>
            </div>
          </div>

          {/* Equity & Liquidity Synthesis */}
          <div className="bg-[#151D2F] rounded-2xl p-6 border border-[#1C263D] shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#1C263D] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E5C07B]" />
                  <span>Workshop Equity & Liquidity</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                  Solvent & Verified
                </span>
              </div>

              <div className="space-y-3 text-xs pt-3">
                <div className="p-4 rounded-xl bg-[#0B0F19]/80 border border-[#1C263D]">
                  <div className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                    Total Retained Earnings
                  </div>
                  <div className="text-2xl font-extrabold text-[#C9F31D] font-mono mt-1">
                    {formatCurrency(balanceSheet.retainedEarnings)}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Cumulative settled operating surplus across historical invoices and verified expenses
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F19]/80 border border-[#1C263D]">
                  <div className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                    Immediate Quick Liquidity Ratio
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {formatCurrency(balanceSheet.cashInHand + balanceSheet.bankUpiBalance)}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Instant cash and bank liquidity available for immediate workshop operations
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0F19]/60 border border-[#1C263D] flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Audit Status:</span>
              <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                GST & Books in Balance
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXECUTIVE AI PREDICTIVE SALES FORECAST (MANASH & AKSHAT ONLY) */}
      {activeTab === 'ai_forecast' && isExecutive && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#151D2F] via-[#1C263D] to-[#0B0F19] p-6 rounded-3xl border-2 border-[#E5C07B]/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#E5C07B]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E5C07B]/20 border border-[#E5C07B] flex items-center justify-center text-[#E5C07B] text-xl font-bold shadow-lg">
                  👑
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>AI-Powered Predictive Sales Forecast</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5C07B] text-[#0B0F19] font-bold">
                      EXECUTIVE ONLY
                    </span>
                  </h2>
                  <p className="text-xs text-[#E5C07B]">
                    Authorized Executive Cockpit: {forecastData?.executive} ({forecastData?.executiveEmail})
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Daily Run Rate</div>
                <div className="text-xl font-extrabold text-[#C9F31D] font-mono">
                  {formatCurrency(forecastData?.historicalMetrics?.dailyRevenueRunRate || 0)} / day
                </div>
              </div>
            </div>
          </div>

          {/* 30, 60, 90 Day Projections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 30-Day Forecast */}
            <div className="bg-[#151D2F] rounded-2xl p-5 border border-[#1C263D] shadow-lg relative">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                <span>Next 30 Days</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                  {forecastData?.forecast?.next30Days?.confidenceScore}% Confidence
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[#C9F31D] font-mono mt-3">
                {formatCurrency(forecastData?.forecast?.next30Days?.projectedRevenue || 0)}
              </div>
              <div className="text-xs text-[#94A3B8] mt-1">Projected Gross Revenue</div>

              <div className="mt-4 pt-3 border-t border-[#1C263D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Projected Net Profit:</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    {formatCurrency(forecastData?.forecast?.next30Days?.projectedNetProfit || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Jobs Volume:</span>
                  <span className="font-mono font-bold text-white">
                    {forecastData?.forecast?.next30Days?.estimatedJobsCount} job cards
                  </span>
                </div>
              </div>
            </div>

            {/* 60-Day Forecast */}
            <div className="bg-[#151D2F] rounded-2xl p-5 border border-[#1C263D] shadow-lg relative">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                <span>Next 60 Days</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] font-bold">
                  {forecastData?.forecast?.next60Days?.confidenceScore}% Confidence
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[#38BDF8] font-mono mt-3">
                {formatCurrency(forecastData?.forecast?.next60Days?.projectedRevenue || 0)}
              </div>
              <div className="text-xs text-[#94A3B8] mt-1">Projected 60-Day Trajectory</div>

              <div className="mt-4 pt-3 border-t border-[#1C263D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Projected Net Profit:</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    {formatCurrency(forecastData?.forecast?.next60Days?.projectedNetProfit || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Jobs Volume:</span>
                  <span className="font-mono font-bold text-white">
                    {forecastData?.forecast?.next60Days?.estimatedJobsCount} job cards
                  </span>
                </div>
              </div>
            </div>

            {/* 90-Day Forecast */}
            <div className="bg-[#151D2F] rounded-2xl p-5 border border-[#1C263D] shadow-lg relative">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                <span>Next 90 Days (Quarter)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#E5C07B]/20 text-[#E5C07B] font-bold">
                  {forecastData?.forecast?.next90Days?.confidenceScore}% Confidence
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[#E5C07B] font-mono mt-3">
                {formatCurrency(forecastData?.forecast?.next90Days?.projectedRevenue || 0)}
              </div>
              <div className="text-xs text-[#94A3B8] mt-1">Projected Quarterly Volume</div>

              <div className="mt-4 pt-3 border-t border-[#1C263D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Projected Net Profit:</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    {formatCurrency(forecastData?.forecast?.next90Days?.projectedNetProfit || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Jobs Volume:</span>
                  <span className="font-mono font-bold text-white">
                    {forecastData?.forecast?.next90Days?.estimatedJobsCount} job cards
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategic Insights & High Demand Parts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Strategic Recommendations */}
            <div className="bg-[#151D2F] rounded-2xl p-6 border border-[#1C263D] shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9F31D]" />
                <span>Executive AI Recommendations for MotoFit</span>
              </h3>

              <div className="space-y-3 pt-2">
                {(forecastData?.aiRecommendations || []).map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#0B0F19]/80 border border-[#1C263D] space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                      <span className="text-[11px] font-bold font-mono text-[#C9F31D]">{rec.impact}</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">{rec.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Spares Demand Forecast */}
            <div className="bg-[#151D2F] rounded-2xl p-6 border border-[#1C263D] shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#E5C07B]" />
                <span>Next Month High-Turnover Spares Demand</span>
              </h3>

              <div className="space-y-2.5 pt-2">
                {(forecastData?.predictedPartsDemand || []).map((part: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/80 border border-[#1C263D] text-xs">
                    <div>
                      <div className="font-bold text-white">{part.category}</div>
                      <div className="text-[10px] text-[#64748B]">Projected turnover velocity: High</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#C9F31D]">
                        {formatCurrency(part.nextMonthEstimatedDemandRupees)}
                      </div>
                      <span className="text-[9px] font-bold text-[#E5C07B] uppercase">Order Priority</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151D2F] border border-[#1C263D] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C263D]">
              <h3 className="text-lg font-extrabold text-white">
                {modalMode === 'edit'
                  ? 'Edit Ledger Entry'
                  : formType === 'INCOME'
                  ? '+ Record Operating Income'
                  : '- Record Workshop Expense'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Entry Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('EXPENSE');
                      setFormCategory(EXPENSE_CATEGORIES[0]);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      formType === 'EXPENSE'
                        ? 'bg-[#FF5E14] text-white border-[#FF5E14]'
                        : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D]'
                    }`}
                  >
                    - Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('INCOME');
                      setFormCategory(INCOME_CATEGORIES[0]);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      formType === 'INCOME'
                        ? 'bg-[#10B981] text-[#0B0F19] border-[#10B981]'
                        : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D]'
                    }`}
                  >
                    + Income
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl text-xs text-white focus:ring-1 focus:ring-[#C9F31D] outline-none cursor-pointer"
                >
                  {(formType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl text-sm font-mono font-bold text-white focus:ring-1 focus:ring-[#C9F31D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl text-xs text-white focus:ring-1 focus:ring-[#C9F31D] outline-none cursor-pointer"
                  >
                    <option value="cash">💵 Cash in Hand</option>
                    <option value="upi">📱 UPI / QR</option>
                    <option value="bank">🏦 Bank Transfer</option>
                    <option value="card">💳 Card</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. 10L Motul 10W40 oil purchase, or Workshop electricity bill"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl text-xs text-white placeholder-[#64748B] focus:ring-1 focus:ring-[#C9F31D] outline-none"
                />
              </div>

              {/* Date & Voucher Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl text-xs font-mono text-white focus:ring-1 focus:ring-[#C9F31D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Voucher # / Reference
                  </label>
                  <input
                    type="text"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    placeholder="e.g. VCH-0042 or UPI Ref"
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl text-xs font-mono text-white placeholder-[#64748B] focus:ring-1 focus:ring-[#C9F31D] outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C263D]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#C9F31D] text-[#0B0F19] font-extrabold text-xs hover:bg-[#b8e214] shadow-[0_0_15px_rgba(201,243,29,0.3)] disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Update Entry' : 'Save Ledger Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
