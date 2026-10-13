'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, ShieldAlert, Zap } from 'lucide-react';
import ExpressIntakeModal from '@/components/ExpressIntakeModal';
import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';

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

  useEffect(() => {
    void fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const response = await fetch(`/api/jobcards?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        setJobCards(Array.isArray(result) ? result : result.data || []);
      }
    } catch (error) {
      console.error('Error fetching job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'normal':
        return 'text-blue-600 dark:text-blue-400';
      case 'low':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by job number, customer, vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
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
                      onClick={() => alert(`Quick payment collected for ${job.jobNumber}! Keys handed over.`)}
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
                      onClick={() => alert(`Opening itemized invoice breakdown for ${job.jobNumber}...`)}
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
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                            {job.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium uppercase ${getPriorityColor(job.priority)}`}>
                            {job.priority} Priority
                          </span>
                          {job.preInspectionShield && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              <ShieldAlert className="w-3 h-3" /> Shield Active
                            </span>
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
                    <button className="flex-1 lg:flex-none px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                      View Details
                    </button>
                    {job.status === 'completed' && (
                      <PearlButton className="text-xs">
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
    </div>
  );
}
