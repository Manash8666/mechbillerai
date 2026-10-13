'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Mail, X } from 'lucide-react';
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
            make: 'Standard Vehicle',
            model: 'General',
          }),
        });
      }

      toast.success(`Customer ${name} added successfully!`);
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setVehicleReg('');
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-1">
                  Vehicle Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH12AB1234"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/30 rounded-lg text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
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
    </div>
  );
}
