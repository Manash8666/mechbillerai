'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Download, Eye, IndianRupee, X, Trash2, QrCode, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';
import { generateInvoiceOrEstimatePdf } from '@/lib/invoicePdfGenerator';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode: string;
  createdAt: string;
  dueDate?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  jobCard?: {
    jobNumber: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // New Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'ESTIMATE'>('INVOICE');
  const [lineItems, setLineItems] = useState<
    { description: string; quantity: number; unitPrice: number }[]
  >([{ description: 'General Service & Inspection', quantity: 1, unitPrice: 1500 }]);

  // Counter UPI QR Modal State
  const [selectedUpiInvoice, setSelectedUpiInvoice] = useState<Invoice | null>(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    void fetchInvoices();
    void fetchCustomerOptions();
  }, []);

  const fetchCustomerOptions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const res = await fetch(`/api/customers?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching customers for invoice modal:', err);
    }
  };

  const handleDownloadBillPdf = (invoice: Invoice, docType: 'INVOICE' | 'ESTIMATE' = 'INVOICE') => {
    try {
      const fileName = `${docType}_${invoice.invoiceNumber}.pdf`;
      const link = document.createElement('a');
      link.href = `/api/pdf/invoice?id=${invoice.invoiceNumber}&docType=${docType}`;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${docType} PDF (${fileName}) generated!`);
    } catch (err) {
      console.error('Error downloading bill PDF:', err);
      window.open(`/api/pdf/invoice?id=${invoice.invoiceNumber}`, '_blank');
    }
  };

  const handleOpenCounterUpi = async (invoice: Invoice) => {
    setSelectedUpiInvoice(invoice);
    setLoadingQr(true);
    try {
      const { generateUpiQrDataUrl } = await import('@/lib/upi');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const amount = invoice.balance > 0 ? invoice.balance : invoice.total;
      const dataUrl = await generateUpiQrDataUrl({
        vpa: 'motoban@icici',
        payeeName: user.name || 'MotoBan Workshop',
        amount: amount,
        invoiceNumber: invoice.invoiceNumber,
        notes: `Bill #${invoice.invoiceNumber}`,
      });
      setUpiQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate UPI QR:', err);
      toast.error('Could not generate UPI QR code');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleShareWhatsApp = (invoice: Invoice) => {
    if (!invoice.customer?.phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const { buildWhatsAppBillUrl } = require('@/lib/whatsapp');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceUrl = `${origin}/api/pdf/invoice?id=${invoice.invoiceNumber}&docType=INVOICE`;
    
    const url = buildWhatsAppBillUrl({
      phone: invoice.customer.phone,
      customerName: invoice.customer.name || 'Customer',
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.total,
      paidAmount: invoice.paid,
      balanceAmount: invoice.balance,
      garageName: user.name || 'MotoBan Workshop',
      invoiceUrl,
    });
    window.open(url, '_blank');
  };

  const fetchInvoices = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const response = await fetch(`/api/invoices?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        setInvoices(Array.isArray(result) ? result : result.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    val: any
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  const calculatedSubtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const calculatedTax = Math.round(calculatedSubtotal * 0.18);
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (lineItems.length === 0 || calculatedTotal <= 0) {
      toast.error('Please add at least one line item with a price');
      return;
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId') || 'cmv4zl4620001d96sd1e0qto2';

      const payload = {
        userId,
        customerId: selectedCustomerId,
        paymentMode,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        discount: 0,
        total: calculatedTotal,
        items: lineItems.map((item) => ({
          description: item.description || 'Workshop Service',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          tax: Math.round(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)) * 0.18),
          total: Math.round(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)) * 1.18),
        })),
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create invoice');
      }

      const created = await res.json();
      toast.success(`Invoice ${created.invoiceNumber || 'created'} saved successfully!`);
      setIsModalOpen(false);
      setLineItems([{ description: 'General Service & Inspection', quantity: 1, unitPrice: 1500 }]);
      await fetchInvoices();

      // Trigger automatic PDF download
      handleDownloadBillPdf(created, invoiceType);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'overdue':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Loading Invoices" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage billing, estimates, and payments</p>
        </div>
        <PearlButton onClick={() => setIsModalOpen(true)} className="text-xs">
          <Plus className="w-4 h-4 mr-1 text-luxury-gold" />
          New Invoice / Estimate
        </PearlButton>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50" />
          <input
            type="text"
            placeholder="Search by invoice number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold placeholder:text-luxury-ink-light/50 dark:placeholder:text-luxury-ink-dark/50"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold text-foreground mt-1">{invoices.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground mt-1">Create an invoice or adjust your search filters</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="font-mono font-bold text-lg text-foreground">{invoice.invoiceNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    {invoice.jobCard && (
                      <span className="text-xs text-muted-foreground font-mono">
                        Job: {invoice.jobCard.jobNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="text-sm font-medium text-foreground">{invoice.customer?.name || 'Walk-in'}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customer?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Mode</p>
                      <p className="text-sm font-medium text-foreground uppercase">{invoice.paymentMode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                      <p className="text-sm font-medium text-foreground">₹{invoice.subtotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GST (18%)</p>
                      <p className="text-sm font-medium text-foreground">₹{invoice.tax.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-sm font-bold text-foreground">₹{invoice.total.toLocaleString('en-IN')}</p>
                    </div>
                    {invoice.balance > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">₹{invoice.balance.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Items ({invoice.items?.length || 0})</p>
                    <p className="text-sm text-foreground">
                      {invoice.items?.slice(0, 2).map((item) => item.description).join(', ')}
                      {(invoice.items?.length || 0) > 2 && ` +${invoice.items.length - 2} more`}
                    </p>
                  </div>
                </div>

                  {/* Right Section - Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCounterUpi(invoice)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-[#C9F31D] text-[#0B0F19] font-bold rounded-lg hover:bg-[#d8ff33] transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Show Dynamic Counter UPI QR Code for quick payment"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Counter UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(invoice)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Send Bill Summary & PDF link via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp Bill
                    </button>
                    <a
                      href={`/api/pdf/invoice?id=${invoice.invoiceNumber}&docType=INVOICE`}
                      download={`Invoice_${invoice.invoiceNumber}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-red-600/90 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Download Tax Invoice / Bill (Red, Black & White format)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Bill PDF
                    </a>
                    <a
                      href={`/api/pdf/invoice?id=${invoice.invoiceNumber}&docType=ESTIMATE`}
                      download={`Estimate_${invoice.invoiceNumber}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/40 font-semibold rounded-lg hover:border-luxury-gold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Download Estimate / Quote (Red, Black & White format)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Estimate PDF
                    </a>
                  </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Invoice / Estimate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-luxury-gold/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create New Invoice / Estimate</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter billing items, select customer, and generate PDF
              </p>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInvoiceType('INVOICE')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    invoiceType === 'INVOICE'
                      ? 'bg-red-600 text-white shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceType('ESTIMATE')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    invoiceType === 'ESTIMATE'
                      ? 'bg-luxury-gold text-slate-900 shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Estimate / Quotation
                </button>
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Select Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="card">Card / POS</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Items & Labor Charges *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-luxury-gold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description (e.g. Engine Oil, Brake Pad)"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-16 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs text-center focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Price (₹)"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs text-right focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        required
                      />
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3.5 rounded-lg bg-muted/60 border border-border space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-foreground">₹{calculatedTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1">
                  <span>Grand Total:</span>
                  <span className="text-luxury-gold">₹{calculatedTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <PearlButton type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : `Save & Generate ${invoiceType === 'INVOICE' ? 'Invoice' : 'Estimate'} PDF`}
                </PearlButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Counter UPI QR Code Modal */}
      {selectedUpiInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-luxury-surface-light dark:bg-[#151D2F] border border-[#C9F31D]/40 rounded-2xl max-w-sm w-full p-6 text-center relative shadow-2xl">
            <button
              onClick={() => {
                setSelectedUpiInvoice(null);
                setUpiQrDataUrl(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex p-3 rounded-full bg-[#C9F31D]/10 text-[#C9F31D] mb-3">
              <QrCode className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-foreground">
              Counter UPI Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Invoice #{selectedUpiInvoice.invoiceNumber} · {selectedUpiInvoice.customer?.name}
            </p>

            {/* QR Code Container */}
            <div className="my-5 p-4 bg-white rounded-xl inline-block shadow-inner border border-gray-200">
              {loadingQr || !upiQrDataUrl ? (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-500">
                  Generating Counter QR...
                </div>
              ) : (
                <img
                  src={upiQrDataUrl}
                  alt={`UPI QR for ${selectedUpiInvoice.invoiceNumber}`}
                  className="w-48 h-48 mx-auto"
                />
              )}
            </div>

            <div className="bg-black/20 dark:bg-black/40 rounded-xl p-3 border border-border/40 mb-4">
              <p className="text-xs text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-black text-[#C9F31D] font-mono mt-0.5">
                ₹{(selectedUpiInvoice.balance > 0 ? selectedUpiInvoice.balance : selectedUpiInvoice.total).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Scan with any UPI App: GPay, PhonePe, Paytm, BHIM
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUpiInvoice(null);
                  setUpiQrDataUrl(null);
                }}
                className="w-full py-2.5 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 text-sm transition-colors"
              >
                Close Counter Display
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
