'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, ShieldAlert, Zap, Download, X, Camera, Mic, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ExpressIntakeModal from '@/components/ExpressIntakeModal';
import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';
import { generateJobCardPdf } from '@/lib/jobCardPdfGenerator';
import { generateInvoiceOrEstimatePdf } from '@/lib/invoicePdfGenerator';

interface JobCard {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  completedDate?: string;
  voiceNote?: string | null;
  preInspectionShield?: string | null;
  notes?: string | null;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    registrationNo: string;
    make: string;
    model: string;
  };
  tasks: {
    description: string;
    completed: boolean;
  }[];
}

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'evening-triage'>('all');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedShieldJob, setSelectedShieldJob] = useState<JobCard | null>(null);

  // Edit Job Card State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [editPriority, setEditPriority] = useState('normal');
  const [editDescription, setEditDescription] = useState('');
  const [editEstimatedCost, setEditEstimatedCost] = useState('0');
  const [editActualCost, setEditActualCost] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updatingJob, setUpdatingJob] = useState(false);

  useEffect(() => {
    void fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId') || 'cmv4zl4620001d96sd1e0qto2';
      const response = await fetch(`/api/jobcards?userId=${userId}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          setJobCards(Array.isArray(result) ? result : result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdfFile = async (url: string, defaultFilename: string) => {
    const toastId = toast.loading(`Generating ${defaultFilename}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        let errMessage = 'Failed to generate PDF';
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {}
        throw new Error(errMessage);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`${defaultFilename} downloaded!`, { id: toastId });
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error(err.message || 'Error generating PDF', { id: toastId });
      window.open(url, '_blank');
    }
  };

  const handleDownloadJobCardPdf = (job: JobCard) => {
    void downloadPdfFile(`/api/pdf/jobcard?id=${job.jobNumber}`, `JobCard_${job.jobNumber}.pdf`);
  };

  const handleDownloadEstimatePdf = (job: JobCard) => {
    void downloadPdfFile(`/api/pdf/invoice?id=${job.jobNumber}&docType=ESTIMATE`, `Estimate_${job.jobNumber}.pdf`);
  };
  const handleUpdateJobCardStatus = async (jobId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/jobcards/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Job marked as ${nextStatus.toUpperCase()}`);
        void fetchJobCards();
      } else {
        toast.error('Failed to update job status');
      }
    } catch {
      toast.error('Network error updating job status');
    }
  };

  const handleGenerateInvoiceFromJob = async (job: JobCard) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId') || 'cmv4zl4620001d96sd1e0qto2';

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customerId: (job as any).customerId || (job.customer as any).id,
          jobCardId: job.id,
          items: [
            {
              description: job.description || 'Vehicle Repair & Maintenance',
              quantity: 1,
              unitPrice: job.actualCost || job.estimatedCost || 800,
              total: job.actualCost || job.estimatedCost || 800,
            },
          ],
          total: job.actualCost || job.estimatedCost || 800,
          paymentMode: 'cash',
        }),
      });

      if (res.ok) {
        toast.success('Invoice generated successfully!');
        window.location.href = '/dashboard/invoices';
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to generate invoice');
      }
    } catch {
      toast.error('Failed to create invoice');
    }
  };

  const handleDeleteJobCard = async (id: string, jobNumber: string) => {
    if (!confirm(`Are you sure you want to delete Job Card #${jobNumber}? This will permanently remove it.`)) {
      return;
    }
    const toastId = toast.loading(`Deleting Job Card #${jobNumber}...`);
    try {
      const res = await fetch(`/api/jobcards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Job Card #${jobNumber} deleted successfully`, { id: toastId });
        setJobCards((prev) => prev.filter((j) => j.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete job card', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error deleting job card', { id: toastId });
    }
  };

  const handleOpenEditModal = (job: JobCard) => {
    setEditingJob(job);
    setEditStatus(job.status || 'pending');
    setEditPriority(job.priority || 'normal');
    setEditDescription(job.description || '');
    setEditEstimatedCost(String(job.estimatedCost || 0));
    setEditActualCost(job.actualCost !== undefined && job.actualCost !== null ? String(job.actualCost) : '');
    setEditNotes(job.notes || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      setUpdatingJob(true);
      const payload = {
        status: editStatus,
        priority: editPriority,
        description: editDescription,
        estimatedCost: Number(editEstimatedCost) || 0,
        actualCost: editActualCost !== '' ? Number(editActualCost) : null,
        notes: editNotes,
      };

      const res = await fetch(`/api/jobcards/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update job card');
      }

      toast.success(`Job Card #${editingJob.jobNumber} updated successfully!`);
      setIsEditModalOpen(false);
      setEditingJob(null);
      await fetchJobCards();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating job card');
    } finally {
      setUpdatingJob(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'in-progress':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'normal':
        return 'text-blue-400';
      case 'low':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredJobCards = jobCards.filter(job => {
    const matchesSearch = 
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.vehicle.registrationNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getTaskProgress = (tasks: { completed: boolean }[]) => {
    const completed = tasks.filter(t => t.completed).length;
    return `${completed}/${tasks.length}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Generating" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Express Intake & Evening Rush Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Cards</h1>
          <p className="text-muted-foreground mt-1">Manage service jobs, Express Morning Intake & Evening Triage</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PearlButton
            onClick={() => setIsIntakeOpen(true)}
            className="text-xs"
          >
            <ShieldAlert className="w-4 h-4 mr-1 text-luxury-gold" />
            Express Intake (Shield)
          </PearlButton>
          <PearlButton
            onClick={() => setIsIntakeOpen(true)}
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Job Card
          </PearlButton>
        </div>
      </div>

      {/* Tab Switcher: Standard View vs Evening Rush Hour Triage */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'border-luxury-gold text-luxury-gold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Job Cards
        </button>
        <button
          onClick={() => setActiveTab('evening-triage')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'evening-triage'
              ? 'border-luxury-gold text-luxury-gold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          Evening Rush Checkout (Split Triage)
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50" />
          <input
            type="text"
            placeholder="Search by job number, customer, vehicle..."
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
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-2xl font-bold text-foreground mt-1">{jobCards.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {jobCards.filter(j => j.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {jobCards.filter(j => j.status === 'in-progress').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {jobCards.filter(j => j.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* View Content: Either Split Triage or Standard List */}
      {activeTab === 'evening-triage' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 shrink-0" />
              <span><strong>Evening Rush Mode:</strong> Rapid triage for pickup rush. Collect minor job payments instantly or review detailed overhauls.</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-1 rounded">Rush Hour Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Pay Column (Minor Jobs <= ₹1500) */}
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-xs">
                ⚡ Quick Pay (Minor Jobs · Rapid Cash/UPI)
              </div>
              {filteredJobCards.filter(j => j.estimatedCost <= 1500).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                  No minor quick-pay jobs waiting.
                </div>
              ) : (
                filteredJobCards.filter(j => j.estimatedCost <= 1500).map((job) => (
                  <div key={job.id} className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center justify-between hover:border-emerald-500/50 transition-all">
                    <div>
                      <div className="font-bold text-foreground">{job.vehicle.registrationNo}</div>
                      <div className="text-xs text-muted-foreground">{job.customer.name} · {job.description}</div>
                      <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹{job.estimatedCost}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await handleUpdateJobCardStatus(job.id, 'completed');
                        await handleGenerateInvoiceFromJob(job);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
                    >
                      Collect ₹{job.estimatedCost}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Detailed Review Column (Major Overhauls > ₹1500) */}
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-luxury-gold/20 border border-luxury-gold/40 text-center font-bold text-luxury-gold uppercase tracking-wider text-xs">
                🔍 Detailed Review (Major Jobs · Itemized Verification)
              </div>
              {filteredJobCards.filter(j => j.estimatedCost > 1500).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                  No major overhauls pending detailed bill review.
                </div>
              ) : (
                filteredJobCards.filter(j => j.estimatedCost > 1500).map((job) => (
                  <div key={job.id} className="p-4 rounded-xl bg-card border-2 border-luxury-gold/40 shadow-sm flex items-center justify-between hover:border-luxury-gold transition-all">
                    <div>
                      <div className="font-bold text-foreground">{job.vehicle.registrationNo}</div>
                      <div className="text-xs text-muted-foreground">{job.customer.name} · {job.description}</div>
                      <div className="text-base font-extrabold text-luxury-gold mt-1">₹{job.estimatedCost.toLocaleString('en-IN')}</div>
                    </div>
                    <button
                      onClick={() => {
                        window.open(`/api/pdf/invoice?id=${job.jobNumber}&docType=ESTIMATE`, '_blank');
                      }}
                      className="px-4 py-2 bg-luxury-gold text-luxury-ink-light font-bold text-xs rounded-lg shadow cursor-pointer hover:brightness-105 transition-colors"
                    >
                      View Bill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Job Cards List */
        <div className="space-y-4">
          {filteredJobCards.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Job Cards Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first job card to get started'}
              </p>
            </div>
          ) : (
            filteredJobCards.map((job) => (
              <div
                key={job.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{job.jobNumber}</h3>
                          <select
                            value={job.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              void handleUpdateJobCardStatus(job.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border border-border/60 bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${getStatusColor(job.status)}`}
                          >
                            <option value="pending">⏳ PENDING</option>
                            <option value="in-progress">🔧 IN PROGRESS</option>
                            <option value="completed">✅ COMPLETED</option>
                            <option value="cancelled">❌ CANCELLED</option>
                          </select>
                          <span className={`text-xs font-medium uppercase ${getPriorityColor(job.priority)}`}>
                            {job.priority} Priority
                          </span>
                          {job.preInspectionShield && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShieldJob(job);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all cursor-pointer"
                              title="Click to view timestamped 4-angle intake proof photos"
                            >
                              <ShieldAlert className="w-3 h-3" /> Shield Active (View Proof)
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(job.createdAt).toLocaleDateString('en-IN', {
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
                        <p className="text-sm font-medium text-foreground">{job.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{job.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vehicle</p>
                        <p className="text-sm font-medium text-foreground">{job.vehicle.registrationNo}</p>
                        <p className="text-xs text-muted-foreground">{job.vehicle.make} {job.vehicle.model}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">{job.description}</p>
                    </div>

                    {job.voiceNote && (
                      <div className="text-xs p-2.5 rounded bg-muted/60 border border-border text-foreground/90 italic">
                        🎙️ Voice Note: &ldquo;{job.voiceNote}&rdquo;
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Tasks Progress</p>
                        <p className="text-sm font-medium text-foreground">{getTaskProgress(job.tasks)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Cost</p>
                        <p className="text-sm font-medium text-foreground">₹{job.estimatedCost.toLocaleString('en-IN')}</p>
                      </div>
                      {job.actualCost && (
                        <div>
                          <p className="text-xs text-muted-foreground">Actual Cost</p>
                          <p className="text-sm font-medium text-foreground">₹{job.actualCost.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <div className="flex gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(job);
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
                        title="Edit Job Card Details & Costs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJobCard(job.id, job.jobNumber);
                        }}
                        className="px-2.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
                        title="Delete Job Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadJobCardPdf(job)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-yellow-400/90 text-yellow-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Vehicle Job Card (Yellow format)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Job Card PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadEstimatePdf(job)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-red-600/90 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Estimate (Red & Black format)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Estimate PDF
                    </button>
                    {job.status === 'completed' && (
                      <PearlButton
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleGenerateInvoiceFromJob(job);
                        }}
                      >
                        Generate Invoice
                      </PearlButton>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Express Intake Modal */}
      <ExpressIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSuccess={() => {
          void fetchJobCards();
        }}
      />

      {/* Pre-Inspection Shield Proof Viewer Modal */}
      {selectedShieldJob && (() => {
        let shieldData: any = {};
        try {
          shieldData = typeof selectedShieldJob.preInspectionShield === 'string'
            ? JSON.parse(selectedShieldJob.preInspectionShield)
            : (selectedShieldJob.preInspectionShield || {});
        } catch {
          shieldData = {};
        }

        const photos = shieldData.photos || {};
        const angles = ['Front', 'Back', 'Left Side', 'Right Side'];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark w-full max-w-2xl rounded-2xl border-2 border-emerald-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      Pre-Inspection Liability Proof Shield
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        VERIFIED INTAKE
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Job #{selectedShieldJob.jobNumber} · {selectedShieldJob.vehicle.registrationNo} ({selectedShieldJob.vehicle.make} {selectedShieldJob.vehicle.model})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShieldJob(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Timestamp & Customer Note */}
                <div className="flex items-center justify-between text-xs bg-muted/40 p-3 rounded-lg border border-border">
                  <div>
                    <span className="text-muted-foreground">Logged Timestamp: </span>
                    <strong className="text-foreground">
                      {shieldData.timestamp ? new Date(shieldData.timestamp).toLocaleString('en-IN') : 'At Intake'}
                    </strong>
                  </div>
                  <div className="text-emerald-500 font-semibold">
                    ✓ Proof Safeguard Protected
                  </div>
                </div>

                {/* 4 Photos Grid */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    4-Angle Vehicle Damage Proof Photos
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {angles.map((angle) => {
                      const photoUrl = photos[angle] || (shieldData[angle.toLowerCase()] ? photos[angle] : null);
                      return (
                        <div key={angle} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-foreground">{angle}</span>
                            {photoUrl ? (
                              <span className="text-[10px] text-emerald-500 font-bold">Captured ✓</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Clean / No Dent</span>
                            )}
                          </div>
                          <div className="aspect-4/3 rounded-xl border border-border bg-black/40 overflow-hidden flex items-center justify-center relative">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={`${angle} vehicle condition`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(photoUrl, '_blank')}
                                title="Click to view full resolution in new tab"
                              />
                            ) : (
                              <div className="text-center p-3">
                                <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                                <span className="text-[11px] text-muted-foreground">No damage snapped</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mechanic Voice Note */}
                {selectedShieldJob.voiceNote && (
                  <div className="p-3.5 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-luxury-gold mb-1">
                      <Mic className="w-4 h-4 text-rose-500" />
                      Recorded Mechanic Voice Note:
                    </div>
                    <p className="text-xs text-foreground italic">
                      &ldquo;{selectedShieldJob.voiceNote}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  Timestamped proof protects mechanics against false scratch claims.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedShieldJob(null)}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Close Proof
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Job Card Modal */}
      {isEditModalOpen && editingJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-luxury-surface-light dark:bg-[#151D2F] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingJob(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Edit Job Card #{editingJob.jobNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editingJob.vehicle.registrationNo} ({editingJob.vehicle.make} {editingJob.vehicle.model}) · {editingJob.customer.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateJobCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔧 In Progress</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Work Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editEstimatedCost}
                    onChange={(e) => setEditEstimatedCost(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Actual Cost (₹) (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank if pending"
                    value={editActualCost}
                    onChange={(e) => setEditActualCost(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Notes / Technician Remarks</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Internal notes, customer requests or spare parts info..."
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingJob(null);
                  }}
                  className="w-1/2 py-2.5 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingJob}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {updatingJob ? 'Saving Changes...' : 'Save Job Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
