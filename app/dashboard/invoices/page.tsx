'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Download, Eye, IndianRupee } from 'lucide-react';

import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.jobCard?.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0);
  const totalPending = invoices.reduce((sum, inv) => sum + inv.balance, 0);

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
          <p className="text-muted-foreground mt-1">Manage billing and payments</p>
        </div>
        <PearlButton className="text-xs">
          <Plus className="w-4 h-4 mr-1 text-luxury-gold" />
          New Invoice
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
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Invoices Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first invoice to get started'}
            </p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="text-sm font-medium text-foreground">{invoice.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customer.phone}</p>
                    </div>
                    {invoice.jobCard && (
                      <div>
                        <p className="text-xs text-muted-foreground">Job Card</p>
                        <p className="text-sm font-medium text-foreground">{invoice.jobCard.jobNumber}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold text-foreground">₹{invoice.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">₹{invoice.paid.toLocaleString('en-IN')}</p>
                    </div>
                    {invoice.balance > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">₹{invoice.balance.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Items ({invoice.items.length})</p>
                    <p className="text-sm text-foreground">
                      {invoice.items.slice(0, 2).map(item => item.description).join(', ')}
                      {invoice.items.length > 2 && ` +${invoice.items.length - 2} more`}
                    </p>
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex lg:flex-col gap-2">
                  <button className="flex-1 lg:flex-none px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button className="flex-1 lg:flex-none px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  {invoice.balance > 0 && (
                    <button className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
