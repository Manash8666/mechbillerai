'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, MapPin, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';

interface Appointment {
  id: string;
  serviceType: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  bay?: string;
  notes?: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // New Appointment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [serviceType, setServiceType] = useState('Periodic Maintenance Service');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [bay, setBay] = useState('Bay 1 - Express Service');

  useEffect(() => {
    void fetchAppointments();
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
      console.error('Error fetching customers:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const response = await fetch(`/api/appointments?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        setAppointments(Array.isArray(result) ? result : result.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId') || 'cmv4zl4620001d96sd1e0qto2';

      const payload = {
        userId,
        customerId: selectedCustomerId,
        serviceType,
        description: description || serviceType,
        date: new Date(date).toISOString(),
        startTime,
        endTime,
        bay,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create appointment');
      }

      toast.success('Appointment scheduled successfully!');
      setIsModalOpen(false);
      setDescription('');
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      toast.error(err.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.bay?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const todayCount = appointments.filter((apt) => {
    const aptDate = new Date(apt.date).toDateString();
    const today = new Date().toDateString();
    return aptDate === today;
  }).length;

  const confirmedCount = appointments.filter((apt) => apt.status === 'confirmed').length;
  const inProgressCount = appointments.filter((apt) => apt.status === 'in-progress').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Loading Appointments" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage service bookings and schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </button>
          <PearlButton onClick={() => setIsModalOpen(true)} className="text-xs">
            <Plus className="w-4 h-4 mr-1 text-luxury-gold" />
            New Appointment
          </PearlButton>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50" />
          <input
            type="text"
            placeholder="Search by customer, service type, bay..."
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
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
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
              <p className="text-sm text-muted-foreground">Today&apos;s Bookings</p>
              <p className="text-2xl font-bold text-foreground mt-1">{todayCount}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{confirmedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{inProgressCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
              <p className="text-2xl font-bold text-foreground mt-1">{appointments.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No appointments found</p>
            <p className="text-sm text-muted-foreground mt-1">Book an appointment or adjust filters</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="font-semibold text-lg text-foreground">{appointment.serviceType}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(appointment.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Time Slot
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </div>
                    {appointment.bay && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Bay
                        </p>
                        <p className="text-sm font-medium text-foreground">{appointment.bay}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium text-foreground">{appointment.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">{appointment.customer?.phone}</p>
                  </div>

                  {appointment.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">{appointment.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-luxury-gold/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Book Service Appointment</h2>
              <p className="text-sm text-muted-foreground mt-1">Schedule garage bay and technician time</p>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label htmlFor="appointmentCustomer" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Select Customer *
                </label>
                <select
                  id="appointmentCustomer"
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

              <div>
                <label htmlFor="appointmentServiceType" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Service Type *
                </label>
                <select
                  id="appointmentServiceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                >
                  <option value="Periodic Maintenance Service">Periodic Maintenance Service</option>
                  <option value="Brake Overhaul & Inspection">Brake Overhaul & Inspection</option>
                  <option value="Engine Diagnostics & Scan">Engine Diagnostics & Scan</option>
                  <option value="Wheel Alignment & Balancing">Wheel Alignment & Balancing</option>
                  <option value="AC Gas Refill & Servicing">AC Gas Refill & Servicing</option>
                  <option value="Dent & Paint Express">Dent & Paint Express</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="appointmentDate" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Date
                  </label>
                  <input
                    id="appointmentDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="appointmentStartTime" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Start
                  </label>
                  <input
                    id="appointmentStartTime"
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="appointmentEndTime" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    End
                  </label>
                  <input
                    id="appointmentEndTime"
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="appointmentBay" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Service Bay
                </label>
                <select
                  id="appointmentBay"
                  value={bay}
                  onChange={(e) => setBay(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                >
                  <option value="Bay 1 - Express Service">Bay 1 - Express Service</option>
                  <option value="Bay 2 - Heavy Mechanical Lift">Bay 2 - Heavy Mechanical Lift</option>
                  <option value="Bay 3 - Electrical & Diagnostics">Bay 3 - Electrical & Diagnostics</option>
                  <option value="Bay 4 - Detailing & Wash">Bay 4 - Detailing & Wash</option>
                </select>
              </div>

              <div>
                <label htmlFor="appointmentNotes" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Customer Notes / Symptoms
                </label>
                <textarea
                  id="appointmentNotes"
                  rows={2}
                  placeholder="e.g. Squeaking noise when braking, oil change requested"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <PearlButton type="submit" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </PearlButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
