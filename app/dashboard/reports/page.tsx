'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  Receipt,
  Wrench,
  Package,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

type PeriodType = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1' | 'H2' | 'YEARLY';

export default function CaAuditReportsPage() {
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('Q3');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReport = async (period: PeriodType, fy: string) => {
    try {
      setLoading(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userObj = userStr ? JSON.parse(userStr) : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('motoban_token') : null;

      const url = userObj?.id
        ? `/api/reports/ca-audit?userId=${userObj.id}&period=${period}&fy=${fy}`
        : `/api/reports/ca-audit?period=${period}&fy=${fy}`;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        toast.error('Failed to load CA audit report');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading audit report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport(selectedPeriod, financialYear);
  }, [selectedPeriod, financialYear]);

  const handlePeriodChange = (p: PeriodType) => {
    setSelectedPeriod(p);
  };

  const handleExportCsv = () => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const userObj = userStr ? JSON.parse(userStr) : null;
    const url = userObj?.id
      ? `/api/reports/ca-audit?userId=${userObj.id}&period=${selectedPeriod}&fy=${financialYear}&format=csv`
      : `/api/reports/ca-audit?period=${selectedPeriod}&fy=${financialYear}&format=csv`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `CA_Audit_Report_${financialYear}_${selectedPeriod}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success('Downloaded CA Audit CSV Report!');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const filteredInvoices = (report?.invoiceRegister || []).filter((inv: any) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.includes(q) ||
      inv.vehicle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-pure-white">
              Chartered Accountant (CA) Audit Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-steel-dim mt-1">
            GSTR-1, GSTR-3B, Taxable Sales, Labor vs Spares split, and collection ledgers for financial audits.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* FY Selector */}
          <div className="flex items-center gap-2 bg-luxury-surface-dark border border-luxury-gold/30 rounded-xl px-3 py-1.5">
            <Calendar className="h-4 w-4 text-luxury-gold" />
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent text-pure-white text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026-2027" className="bg-[#151D2F]">FY 2026-2027</option>
              <option value="2025-2026" className="bg-[#151D2F]">FY 2025-2026</option>
              <option value="2024-2025" className="bg-[#151D2F]">FY 2024-2025</option>
            </select>
          </div>

          <button
            onClick={() => void fetchReport(selectedPeriod, financialYear)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-luxury-surface-dark border border-luxury-gold/30 hover:border-luxury-gold text-steel-dim hover:text-white transition-all"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-geek-lime text-void-black font-bold text-xs shadow-lime-glow hover:bg-geek-lime-hover transition-all"
          >
            <Download className="h-4 w-4" />
            Export CA CSV / Excel
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-luxury-surface-dark border border-luxury-gold/40 text-pure-white font-bold text-xs hover:border-luxury-gold transition-all"
          >
            <Printer className="h-4 w-4 text-luxury-gold" />
            Print CA Certificate
          </button>
        </div>
      </div>

      {/* Period Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none print:hidden">
        {[
          { id: 'Q1', label: 'Q1 (Apr–Jun)' },
          { id: 'Q2', label: 'Q2 (Jul–Sep)' },
          { id: 'Q3', label: 'Q3 (Oct–Dec)' },
          { id: 'Q4', label: 'Q4 (Jan–Mar)' },
          { id: 'H1', label: 'Half-Yearly H1 (Apr–Sep)' },
          { id: 'H2', label: 'Half-Yearly H2 (Oct–Mar)' },
          { id: 'YEARLY', label: 'Full Financial Year' },
        ].map((tab) => {
          const isActive = selectedPeriod === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handlePeriodChange(tab.id as PeriodType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-luxury-gold text-void-black shadow-lg shadow-luxury-gold/20'
                  : 'bg-luxury-surface-dark/90 border border-luxury-gold/20 text-steel-dim hover:text-white hover:border-luxury-gold/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Printable Audit Header (Visible in Print or Top of Report) */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-gold/20">
          <div>
            <span className="text-[10px] tracking-wider uppercase font-bold text-royal-gold">
              OFFICIAL FINANCIAL AUDIT STATEMENT FOR CHARTERED ACCOUNTANTS
            </span>
            <h2 className="text-xl font-bold text-pure-white mt-1">
              {report?.workshop?.garageName || 'MotoFit 2 Workshop'}
            </h2>
            <p className="text-xs text-steel-dim mt-0.5">
              Proprietor: {report?.workshop?.ownerName || 'Akshat Mohanty'} | Phone: {report?.workshop?.phone || '7259625881'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Audit Period: {report?.periodLabel || selectedPeriod}
            </span>
            <p className="text-xs text-steel-dim mt-1 font-mono">
              From {report?.dateRange?.from || '01-10-2026'} To {report?.dateRange?.to || '31-12-2026'}
            </p>
          </div>
        </div>

        {/* 6 Key Financial Audit Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className="p-4 rounded-xl bg-void-black/60 border border-luxury-gold/20">
            <span className="text-[11px] font-bold text-steel-dim block">Gross Sales Turnover</span>
            <span className="text-lg font-black text-pure-white mt-1 block">
              {formatCurrency(report?.summary?.totalGrossSales || 0)}
            </span>
            <span className="text-[10px] text-steel-dim">{report?.summary?.totalInvoices || 0} Bills</span>
          </div>

          <div className="p-4 rounded-xl bg-void-black/60 border border-luxury-gold/20">
            <span className="text-[11px] font-bold text-steel-dim block">Taxable Sales Value</span>
            <span className="text-lg font-black text-amber-300 mt-1 block">
              {formatCurrency(report?.summary?.totalTaxableValue || 0)}
            </span>
            <span className="text-[10px] text-steel-dim">Excluding Tax</span>
          </div>

          <div className="p-4 rounded-xl bg-void-black/60 border border-luxury-gold/20">
            <span className="text-[11px] font-bold text-steel-dim block">Total GST Collected</span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">
              {formatCurrency(report?.summary?.totalGstCollected || 0)}
            </span>
            <span className="text-[10px] text-emerald-400/80">CGST + SGST (18%)</span>
          </div>

          <div className="p-4 rounded-xl bg-void-black/60 border border-luxury-gold/20">
            <span className="text-[11px] font-bold text-steel-dim block">Labor Income (SAC 9987)</span>
            <span className="text-lg font-black text-cyan-400 mt-1 block">
              {formatCurrency(report?.revenueStreamSplit?.laborIncome?.grossRevenue || 0)}
            </span>
            <span className="text-[10px] text-steel-dim">Service Charges</span>
          </div>

          <div className="p-4 rounded-xl bg-void-black/60 border border-luxury-gold/20">
            <span className="text-[11px] font-bold text-steel-dim block">Spares Sales (HSN 8714)</span>
            <span className="text-lg font-black text-purple-400 mt-1 block">
              {formatCurrency(report?.revenueStreamSplit?.sparesAndConsumables?.grossRevenue || 0)}
            </span>
            <span className="text-[10px] text-steel-dim">Parts & Oil</span>
          </div>

          <div className="p-4 rounded-xl bg-void-black/60 border border-luxury-gold/20">
            <span className="text-[11px] font-bold text-steel-dim block">Receivables / Credit</span>
            <span className="text-lg font-black text-rose-400 mt-1 block">
              {formatCurrency(report?.summary?.totalReceivables || 0)}
            </span>
            <span className="text-[10px] text-rose-400/80">Pending Dues</span>
          </div>
        </div>
      </div>

      {/* Audit Breakdown Schedules (GSTR & Collection Ledgers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Schedule 1: GSTR Tax Return Split */}
        <div className="p-6 rounded-2xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
          <h3 className="text-base font-bold text-pure-white flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-emerald-400" />
            GST Tax Classification Schedule (GSTR-1 & 3B)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-void-black/50 border border-luxury-gold/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-pure-white block">Output CGST (Central Tax @ 9%)</span>
                <span className="text-steel-dim">Applicable to all intra-state workshop invoices</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(report?.summary?.totalCgst || 0)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-void-black/50 border border-luxury-gold/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-pure-white block">Output SGST (State Tax @ 9%)</span>
                <span className="text-steel-dim">State tax component collected</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(report?.summary?.totalSgst || 0)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-void-black/50 border border-luxury-gold/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-pure-white block">B2B Registered Taxable Sales</span>
                <span className="text-steel-dim">
                  {report?.gstReturnSplit?.b2b?.invoiceCount || 0} Invoices with valid customer GSTIN
                </span>
              </div>
              <span className="text-sm font-bold text-amber-300">
                {formatCurrency(report?.gstReturnSplit?.b2b?.taxableValue || 0)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-void-black/50 border border-luxury-gold/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-pure-white block">B2C Retail Vehicle Owners</span>
                <span className="text-steel-dim">
                  {report?.gstReturnSplit?.b2c?.invoiceCount || 0} Consumer bills without GSTIN
                </span>
              </div>
              <span className="text-sm font-bold text-pure-white">
                {formatCurrency(report?.gstReturnSplit?.b2c?.taxableValue || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule 2: Collection & Payment Reconciliation */}
        <div className="p-6 rounded-2xl bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
          <h3 className="text-base font-bold text-pure-white flex items-center gap-2 mb-4">
            <Banknote className="h-5 w-5 text-luxury-gold" />
            Payment Mode & Cash/Bank Reconciliation
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-void-black/50 border border-luxury-gold/20">
              <div className="flex items-center gap-2 text-steel-dim mb-1">
                <QrCode className="h-4 w-4 text-emerald-400" />
                <span>UPI / QR Collections</span>
              </div>
              <span className="text-base font-bold text-pure-white">
                {formatCurrency(report?.collectionBreakdown?.upiQr || 0)}
              </span>
              <span className="text-[10px] text-steel-dim block mt-0.5">GPay, PhonePe, Paytm</span>
            </div>

            <div className="p-3.5 rounded-xl bg-void-black/50 border border-luxury-gold/20">
              <div className="flex items-center gap-2 text-steel-dim mb-1">
                <Banknote className="h-4 w-4 text-amber-400" />
                <span>Cash In Hand</span>
              </div>
              <span className="text-base font-bold text-pure-white">
                {formatCurrency(report?.collectionBreakdown?.cash || 0)}
              </span>
              <span className="text-[10px] text-steel-dim block mt-0.5">Physical Counter Cash</span>
            </div>

            <div className="p-3.5 rounded-xl bg-void-black/50 border border-luxury-gold/20">
              <div className="flex items-center gap-2 text-steel-dim mb-1">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <span>Card & POS Swipes</span>
              </div>
              <span className="text-base font-bold text-pure-white">
                {formatCurrency(report?.collectionBreakdown?.card || 0)}
              </span>
              <span className="text-[10px] text-steel-dim block mt-0.5">Debit / Credit Cards</span>
            </div>

            <div className="p-3.5 rounded-xl bg-void-black/50 border border-luxury-gold/20">
              <div className="flex items-center gap-2 text-steel-dim mb-1">
                <Building2 className="h-4 w-4 text-purple-400" />
                <span>Bank Transfers</span>
              </div>
              <span className="text-base font-bold text-pure-white">
                {formatCurrency(report?.collectionBreakdown?.bank || 0)}
              </span>
              <span className="text-[10px] text-steel-dim block mt-0.5">NEFT / RTGS / IMPS</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-luxury-gold/15 flex items-center justify-between text-xs font-bold">
            <span className="text-steel-dim">Total Reconciled Collections</span>
            <span className="text-emerald-400 text-sm">
              {formatCurrency(report?.summary?.totalPaid || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Sales Register Table */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/25 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-luxury-gold/15">
          <div>
            <h3 className="text-lg font-bold text-pure-white flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-geek-lime" />
              Itemized Audit Sales Register ({filteredInvoices.length} Bills)
            </h3>
            <p className="text-xs text-steel-dim mt-0.5">
              Verified record of every invoice issued during the audit period with tax splits.
            </p>
          </div>

          <div className="relative w-full sm:w-64 print:hidden">
            <input
              type="text"
              placeholder="Search bill #, customer, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-void-black/70 border border-luxury-gold/30 text-pure-white text-xs focus:outline-none focus:border-geek-lime"
            />
            <Search className="h-4 w-4 text-steel-dim absolute left-3 top-2.5" />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-steel-dim text-xs">
            No invoices recorded for {report?.periodLabel || selectedPeriod}. Create invoices or select another quarter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-luxury-gold/20 text-steel-dim uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer & Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                  <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-3 text-center">Mode</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-gold/10">
                {filteredInvoices.map((row: any) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-steel-dim whitespace-nowrap">{row.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {row.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-pure-white block leading-tight">{row.customerName}</span>
                      <span className="text-[10px] text-steel-dim">{row.vehicle}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-pure-white">
                      {formatCurrency(row.taxable)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {formatCurrency(row.cgst)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {formatCurrency(row.sgst)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-pure-white">
                      {formatCurrency(row.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="uppercase text-[9px] font-bold px-2 py-0.5 rounded bg-black/40 text-steel-dim border border-luxury-gold/20">
                        {row.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          row.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official CA Sign-Off Box (Printable) */}
      <div className="rounded-2xl p-6 bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/20 text-xs text-steel-dim flex flex-col sm:flex-row items-center justify-between gap-6 print:border-black">
        <div>
          <span className="font-bold text-pure-white block">Chartered Accountant Verification & Audit Stamp</span>
          <p className="text-[11px] mt-0.5 max-w-lg">
            This schedule has been compiled in accordance with Section 35(5) of the CGST Act and is certified true and correct as per the automated books of account maintained in MotoBan AI SaaS.
          </p>
        </div>

        <div className="flex items-center gap-8 text-center shrink-0">
          <div>
            <div className="h-14 w-32 border-b-2 border-dashed border-steel-dim/50 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Authorized Signatory</span>
          </div>
          <div>
            <div className="h-14 w-32 border-b-2 border-dashed border-steel-dim/50 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">CA Seal & Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
