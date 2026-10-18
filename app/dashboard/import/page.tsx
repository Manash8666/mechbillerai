'use client';

import React, { useState, useRef } from 'react';
import {
  FileUp,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Plus,
  ArrowRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  Building2,
  Car,
  User,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface LineItem {
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ParsedInvoice {
  invoiceNumber: string;
  date: string;
  serviceType?: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    vehicleModel?: string;
    vehicleReg?: string;
  };
  vehicle?: {
    makeModel?: string;
    registrationNo?: string;
    refEstimate?: string;
  };
  items: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode?: string;
  garageName?: string;
}

interface ParsedInventoryItem {
  name: string;
  code?: string;
  category?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
}

export default function ImportDataPage() {
  const [selectedSource, setSelectedSource] = useState<'GEMINI' | 'VYAPAR' | 'GENERIC'>('GEMINI');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [committedResult, setCommittedResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable state after parsing
  const [editableInvoices, setEditableInvoices] = useState<ParsedInvoice[]>([]);
  const [editableInventory, setEditableInventory] = useState<ParsedInventoryItem[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      void parseFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      void parseFile(dropped);
    }
  };

  const parseFile = async (targetFile: File) => {
    setParsing(true);
    setParseResult(null);
    setCommittedResult(null);
    const toastId = toast.loading(`Parsing ${targetFile.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to parse file');
      }

      const data = await res.json();
      setParseResult(data);

      if (data.invoices && Array.isArray(data.invoices)) {
        setEditableInvoices(data.invoices);
      }
      if (data.inventoryItems && Array.isArray(data.inventoryItems)) {
        setEditableInventory(data.inventoryItems);
      }

      toast.success(data.summary || 'File parsed successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Parse error:', err);
      toast.error(err.message || 'Failed to parse file. Please verify format.', { id: toastId });
    } finally {
      setParsing(false);
    }
  };

  const handleLoadMotoFitSample = async () => {
    setParsing(true);
    setParseResult(null);
    setCommittedResult(null);
    const toastId = toast.loading('Loading verified MotoFit 2 / Gemini SOW Bill sample...');

    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleType: 'MOTOFIT_GEMINI_SAMPLE' }),
      });

      if (!res.ok) throw new Error('Sample fetch failed');
      const data = await res.json();
      setParseResult(data);
      if (data.invoices) setEditableInvoices(data.invoices);

      toast.success('Loaded MotoFit 2 Gemini SOW Bill (Hero Xtreme 200 Rebuild)!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sample', { id: toastId });
    } finally {
      setParsing(false);
    }
  };

  const handleItemFieldChange = (invIdx: number, itemIdx: number, field: keyof LineItem, val: any) => {
    const updated = [...editableInvoices];
    const currentItem = updated[invIdx].items[itemIdx];
    (currentItem as any)[field] = val;

    if (field === 'quantity' || field === 'unitPrice') {
      currentItem.total = (currentItem.quantity || 1) * (currentItem.unitPrice || 0);
      updated[invIdx].subtotal = updated[invIdx].items.reduce((s, it) => s + it.total, 0);
      updated[invIdx].total = updated[invIdx].subtotal - (updated[invIdx].discount || 0);
      updated[invIdx].paid = updated[invIdx].total;
    }

    setEditableInvoices(updated);
  };

  const handleRemoveItem = (invIdx: number, itemIdx: number) => {
    const updated = [...editableInvoices];
    if (updated[invIdx].items.length === 1) return;
    updated[invIdx].items = updated[invIdx].items.filter((_, i) => i !== itemIdx);
    updated[invIdx].subtotal = updated[invIdx].items.reduce((s, it) => s + it.total, 0);
    updated[invIdx].total = updated[invIdx].subtotal - (updated[invIdx].discount || 0);
    updated[invIdx].paid = updated[invIdx].total;
    setEditableInvoices(updated);
  };

  const handleCommitImport = async () => {
    setCommitting(true);
    const toastId = toast.loading('Committing data to MotoBan Cloud Database...');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');

      const payload = {
        userId,
        invoices: editableInvoices,
        inventoryItems: editableInventory,
        customers: parseResult?.customers || [],
      };

      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to commit data');
      }

      const result = await res.json();
      setCommittedResult(result);
      toast.success('Import completed successfully! 🎉', { id: toastId });
    } catch (err: any) {
      console.error('Commit error:', err);
      toast.error(err.message || 'Failed to commit imported data', { id: toastId });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Import Data & Migration Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30">
              AI Powered
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Migrate from Vyapar app, previous Google Gemini SOW bills, Tally, or Excel spreadsheets with zero data loss.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadMotoFitSample}
            disabled={parsing}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
            title="Load the exact Google Gemini SOW Bill sample uploaded previously"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            ⚡ Test MotoFit 2 Gemini SOW Bill
          </button>
          <Link
            href="/dashboard/invoices"
            className="px-3.5 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-luxury-gold" />
            View Invoices
          </Link>
        </div>
      </div>

      {/* Source Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setSelectedSource('GEMINI')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSource === 'GEMINI'
              ? 'border-purple-500 bg-purple-500/10 shadow-md ring-1 ring-purple-500'
              : 'border-border bg-card hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-600 text-white">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Gemini SOW Bill PDF</h3>
              <p className="text-[11px] text-muted-foreground">MotoFit 2 & AI Rebuild Bills</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Extracts all 2-tier work scopes, spares, technical details, run-in schedules, and totals from your Gemini PDFs.
          </p>
        </div>

        <div
          onClick={() => setSelectedSource('VYAPAR')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSource === 'VYAPAR'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500'
              : 'border-border bg-card hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Vyapar Billing App</h3>
              <p className="text-[11px] text-muted-foreground">Excel / CSV / PDF Exports</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Directly import Vyapar stock inventory, sale invoices, party/customer lists, and HSN codes into MotoBan.
          </p>
        </div>

        <div
          onClick={() => setSelectedSource('GENERIC')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSource === 'GENERIC'
              ? 'border-luxury-gold bg-luxury-gold/10 shadow-md ring-1 ring-luxury-gold'
              : 'border-border bg-card hover:border-luxury-gold/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-luxury-gold text-slate-900">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Tally / Marg / Generic</h3>
              <p className="text-[11px] text-muted-foreground">Spreadsheet & Invoice PDF</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload any automotive workshop spreadsheet or PDF invoice. Our AI automatically maps rows into bills & stock.
          </p>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          parsing
            ? 'border-purple-500 bg-purple-500/5 animate-pulse'
            : 'border-border hover:border-luxury-gold bg-muted/20 hover:bg-muted/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-luxury-gold/10 text-luxury-gold">
            {parsing ? (
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            ) : (
              <FileUp className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {parsing ? 'AI Engine Extracting Data...' : 'Drop your bill PDF or Vyapar Excel/CSV here'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Supports <span className="font-semibold text-foreground">PDF</span> (Gemini / Vyapar / Tally),{' '}
              <span className="font-semibold text-foreground">XLSX, XLS, CSV</span> (Vyapar Items/Invoices/Parties), and Bill Photos.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-luxury-gold text-slate-900 font-bold rounded-lg text-xs hover:opacity-90 shadow"
          >
            Browse File
          </button>
        </div>
      </div>

      {/* Committed Success Card */}
      {committedResult && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Import Completed Successfully!</h2>
              <p className="text-xs text-muted-foreground">
                All records have been saved into your MotoBan Garage database.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-background/80 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground">Invoices Created</p>
              <p className="text-xl font-bold text-emerald-500">{committedResult.importedInvoicesCount || 0}</p>
            </div>
            <div className="p-3 bg-background/80 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground">Inventory Items Added</p>
              <p className="text-xl font-bold text-foreground">{committedResult.importedInventoryCount || 0}</p>
            </div>
            <div className="p-3 bg-background/80 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground">Customer Profiles</p>
              <p className="text-xl font-bold text-foreground">{committedResult.importedCustomersCount || 0}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {committedResult.createdInvoiceIds && committedResult.createdInvoiceIds[0] && (
              <a
                href={`/api/pdf/invoice?id=${committedResult.createdInvoiceIds[0]}&docType=SOW_BILL`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                View Imported SOW Bill PDF ({committedResult.createdInvoiceIds[0]})
              </a>
            )}
            <Link
              href="/dashboard/invoices"
              className="px-3.5 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Go to Invoices Ledger
            </Link>
            <Link
              href="/dashboard/inventory"
              className="px-3.5 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Go to Inventory
            </Link>
          </div>
        </div>
      )}

      {/* Review & Verification Stage */}
      {parseResult && !committedResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 mr-2">
                  {parseResult.sourceType}
                </span>
                <span className="text-xs font-medium text-foreground">{parseResult.summary}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={committing}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {committing ? 'Importing Data...' : 'Confirm & Import to MotoBan'}
            </button>
          </div>

          {/* Invoices Review Section */}
          {editableInvoices.length > 0 && (
            <div className="space-y-4">
              {editableInvoices.map((inv, invIdx) => (
                <div key={invIdx} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  {/* Invoice Header Details */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">Invoice #{inv.invoiceNumber}</span>
                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-0.5 rounded font-semibold border border-red-500/20">
                          {inv.serviceType || 'SOW Service'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Date: {inv.date} | Workshop: {inv.garageName || 'MotoBan'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">CUSTOMER</span>
                        <span className="font-bold text-foreground">{inv.customer.name}</span>
                        {inv.customer.phone && <span className="text-muted-foreground block">({inv.customer.phone})</span>}
                      </div>
                      <div className="border-l border-border pl-4">
                        <span className="text-muted-foreground block text-[10px]">VEHICLE</span>
                        <span className="font-bold text-foreground">{inv.vehicle?.makeModel || inv.customer.vehicleModel || 'Motorcycle'}</span>
                        <span className="text-muted-foreground block">{inv.vehicle?.registrationNo || 'Reg: As Per Estimate'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Itemized Services & Parts ({inv.items.length})
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        ✨ Gemini AI automatically populated all technical breakdowns
                      </span>
                    </div>

                    <div className="border border-border rounded-xl overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/60 text-muted-foreground border-b border-border font-semibold">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-3">Service Item / Spare Part Description</th>
                            <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                            <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                            <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                            <th className="py-2.5 px-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {inv.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="hover:bg-muted/20">
                              <td className="py-2.5 px-3 text-center font-bold text-muted-foreground">
                                {itemIdx + 1}
                              </td>
                              <td className="py-2.5 px-3 space-y-1">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleItemFieldChange(invIdx, itemIdx, 'description', e.target.value)}
                                  className="w-full font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-luxury-gold focus:outline-none"
                                />
                                <div className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                  <input
                                    type="text"
                                    value={item.details || ''}
                                    onChange={(e) => handleItemFieldChange(invIdx, itemIdx, 'details', e.target.value)}
                                    placeholder="Technical description..."
                                    className="w-full text-[11px] text-purple-700 dark:text-purple-300 bg-transparent border-b border-transparent hover:border-border focus:border-luxury-gold focus:outline-none"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemFieldChange(invIdx, itemIdx, 'quantity', Number(e.target.value))}
                                  className="w-14 text-center bg-transparent border border-border rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemFieldChange(invIdx, itemIdx, 'unitPrice', Number(e.target.value))}
                                  className="w-20 text-right bg-transparent border border-border rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-foreground">
                                ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {inv.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(invIdx, itemIdx)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="flex justify-end pt-3">
                      <div className="w-64 space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Gross Subtotal:</span>
                          <span className="font-semibold text-foreground">
                            ₹{inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {inv.discount > 0 && (
                          <div className="flex justify-between text-emerald-500 font-semibold">
                            <span>Special Discount:</span>
                            <span>- ₹{inv.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1">
                          <span>Total Payable:</span>
                          <span className="text-luxury-gold">
                            ₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inventory Items Review Section */}
          {editableInventory.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground">Vyapar Stock & Inventory Spares</h3>
                  <p className="text-xs text-muted-foreground">Ready to import into workshop catalog</p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {editableInventory.length} Items Found
                </span>
              </div>

              <div className="border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3 w-28">Code/HSN</th>
                      <th className="py-2.5 px-3 w-32">Category</th>
                      <th className="py-2.5 px-3 w-20 text-center">Stock</th>
                      <th className="py-2.5 px-3 w-24 text-right">Cost (₹)</th>
                      <th className="py-2.5 px-3 w-24 text-right">Sale (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {editableInventory.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2 px-3 font-semibold text-foreground">{item.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.code || '-'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.category}</td>
                        <td className="py-2 px-3 text-center font-bold text-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground">₹{item.costPrice}</td>
                        <td className="py-2 px-3 text-right font-bold text-luxury-gold">₹{item.sellingPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editableInventory.length > 15 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  + {editableInventory.length - 15} more items will be imported into inventory.
                </p>
              )}
            </div>
          )}

          {/* Bottom Confirm Action */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setParseResult(null);
                setFile(null);
              }}
              className="px-4 py-2 border border-border text-foreground hover:bg-muted rounded-lg text-xs font-semibold"
            >
              Cancel & Upload Another
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={committing}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {committing ? 'Importing Data...' : 'Confirm & Save to MotoBan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
