'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Mail, X, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // Edit Customer Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGstNumber, setEditGstNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  useEffect(() => {
    void fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const response = await fetch(`/api/customers?userId=${userId}`);
      const result = await response.json();
      setCustomers(Array.isArray(result) ? result : result.data || []);
    } catch {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This will delete their profile and records.`)) {
      return;
    }
    const toastId = toast.loading(`Deleting ${customerName}...`);
    try {
      const res = await fetch(`/api/customers/${id}?force=true`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Customer "${customerName}" deleted successfully`, { id: toastId });
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete customer', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error deleting customer', { id: toastId });
    }
  };

  const handleOpenEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditAddress(customer.address || '');
    setEditGstNumber(customer.gstNumber || '');
    setEditNotes(customer.notes || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editName.trim() || !editPhone.trim()) {
      toast.error('Name and Phone are required');
      return;
    }

    try {
      setUpdatingCustomer(true);
      const payload = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        address: editAddress.trim() || null,
        gstNumber: editGstNumber.trim() || null,
        notes: editNotes.trim() || null,
      };

      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update customer');
      }

      toast.success(`Customer "${editName}" updated successfully!`);
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating customer');
    } finally {
      setUpdatingCustomer(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and Phone Number are required');
      return;
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        }),
      });

      const newCust = await res.json();

      if (vehicleReg.trim() && newCust.id) {
        await fetch(`/api/customers/${newCust.id}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationNo: vehicleReg.trim().toUpperCase(),
            make: vehicleMake.trim() || 'Motorcycle / Vehicle',
            model: vehicleModel.trim() || 'Standard Model',
          }),
        });
      }

      toast.success(`Customer ${name} added successfully!`);
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setVehicleReg('');
      setVehicleMake('');
      setVehicleModel('');
      await fetchCustomers();
    } catch {
      toast.error('Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Loading Customers" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">Customers</h1>
          <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mt-1">
            Manage your customers and their vehicles
          </p>
        </div>
        <PearlButton
          onClick={() => setIsModalOpen(true)}
          className="text-xs"
        >
          <Plus className="h-4 w-4 mr-1 text-luxury-gold" />
          Add Customer
        </PearlButton>
      </div>

      {/* Search */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg p-4 border border-luxury-gold/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-lg overflow-hidden border border-luxury-gold/20">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">No customers found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-luxury-gold hover:text-luxury-gold-light font-medium cursor-pointer"
            >
              Add your first customer
            </button>
          </div>
        ) : (
          <div className="divide-y divide-luxury-gold/10">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-luxury-canvas-light/50 dark:hover:bg-luxury-canvas-dark/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-luxury-ink-light dark:text-luxury-ink-dark">
                      {customer.name}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70">
                        <Phone className="h-4 w-4 mr-2 text-luxury-gold" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center text-sm text-luxury-ink-light/70 dark:text-luxury-ink-dark/70">
                          <Mail className="h-4 w-4 mr-2 text-luxury-gold" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                    {customer.vehicles && customer.vehicles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {customer.vehicles.map((vehicle: any) => (
                          <span
                            key={vehicle.id}
                            className="px-3 py-1 bg-luxury-gold/20 text-luxury-gold text-xs font-medium rounded-full border border-luxury-gold/30"
                          >
                            {vehicle.registrationNo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                      {customer._count?.invoices || 0} invoices
                    </div>
                    <div className="text-sm text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                      {customer._count?.jobCards || 0} jobs
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(customer)}
                        className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                        title="Edit Customer Details"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                        className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 shadow-sm"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark border border-luxury-gold/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-luxury-gold/20">
              <h2 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">Add New Customer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-luxury-ink-light/60 hover:text-luxury-ink-light dark:text-luxury-ink-dark/60 dark:hover:text-luxury-ink-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
              <div>
                <label htmlFor="cust-name-input" className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Full Name *
                </label>
                <input
                  id="cust-name-input"
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label htmlFor="cust-phone-input" className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Mobile Number *
                </label>
                <input
                  id="cust-phone-input"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label htmlFor="cust-email-input" className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Email (Optional)
                </label>
                <input
                  id="cust-email-input"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label htmlFor="cust-veh-reg-input" className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Vehicle Registration Number (Optional)
                </label>
                <input
                  id="cust-veh-reg-input"
                  type="text"
                  placeholder="e.g. GJ01PU7510"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="cust-veh-make-input" className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                    Vehicle Make
                  </label>
                  <input
                    id="cust-veh-make-input"
                    type="text"
                    placeholder="e.g. Royal Enfield"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label htmlFor="cust-veh-model-input" className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                    Vehicle Model
                  </label>
                  <input
                    id="cust-veh-model-input"
                    type="text"
                    placeholder="e.g. Classic 350"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <PearlButton type="submit" disabled={submitting} className="w-full text-sm justify-center">
                  {submitting ? 'Saving Customer...' : 'Save & Register Customer'}
                </PearlButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-luxury-surface-light dark:bg-[#151D2F] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Edit Customer</h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4 mt-4">
              <div>
                <label htmlFor="edit-cust-name-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Name *
                </label>
                <input
                  id="edit-cust-name-input"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-cust-phone-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobile Number *
                </label>
                <input
                  id="edit-cust-phone-input"
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-cust-email-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  id="edit-cust-email-input"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-cust-address-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Address
                </label>
                <input
                  id="edit-cust-address-input"
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Street, City, Pincode"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-cust-gst-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  GST Number (GSTIN)
                </label>
                <input
                  id="edit-cust-gst-input"
                  type="text"
                  value={editGstNumber}
                  onChange={(e) => setEditGstNumber(e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                />
              </div>

              <div>
                <label htmlFor="edit-cust-notes-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Notes
                </label>
                <textarea
                  id="edit-cust-notes-input"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Customer preferences, remarks..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="w-1/2 py-2.5 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCustomer}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {updatingCustomer ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
