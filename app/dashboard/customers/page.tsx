'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const response = await fetch(`/api/customers?userId=${userId}`);
      const result = await response.json();
      setCustomers(Array.isArray(result) ? result : result.data || []);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold"></div>
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
        <button className="flex items-center space-x-2 px-4 py-2 bg-luxury-gold text-luxury-ink-light rounded-lg hover:bg-luxury-gold-light hover:shadow-xl transition-all duration-300">
          <Plus className="h-5 w-5" />
          <span>Add Customer</span>
        </button>
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
            <button className="mt-4 text-luxury-gold hover:text-luxury-gold-light font-medium">
              Add your first customer
            </button>
          </div>
        ) : (
          <div className="divide-y divide-luxury-gold/10">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-luxury-canvas-light/50 dark:hover:bg-luxury-canvas-dark/50 transition-colors cursor-pointer"
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
                    {customer.vehicles.length > 0 && (
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
                      {customer._count.invoices} invoices
                    </div>
                    <div className="text-sm text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                      {customer._count.jobCards} jobs
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
